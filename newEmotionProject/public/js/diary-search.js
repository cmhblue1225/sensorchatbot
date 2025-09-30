// 일기 검색 기능
export class DiarySearch {
  constructor() {
    this.searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');
    this.maxHistoryItems = 10;
  }

  // 일기 검색 (키워드, 감정, 날짜)
  async searchDiaries(query, filters = {}) {
    const { supabase } = await import('./supabase.js');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('로그인이 필요합니다.');

    let queryBuilder = supabase
      .from('diaries')
      .select('*')
      .eq('user_id', user.id);

    // 키워드 검색
    if (query && query.trim()) {
      const keywords = query.trim().split(/\s+/);

      // PostgreSQL full-text search 사용
      const searchQuery = keywords.map(word => `'${word}'`).join(' | ');
      queryBuilder = queryBuilder.textSearch('content', searchQuery);
    }

    // 감정 필터
    if (filters.emotion && filters.emotion !== 'all') {
      queryBuilder = queryBuilder.eq('emotion', filters.emotion);
    }

    // 날짜 필터
    if (filters.startDate) {
      queryBuilder = queryBuilder.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      queryBuilder = queryBuilder.lte('created_at', filters.endDate + 'T23:59:59');
    }

    // 정렬
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await queryBuilder;

    if (error) throw error;

    // 클라이언트 사이드 추가 필터링 (더 정확한 키워드 매칭)
    let filteredData = data;
    if (query && query.trim()) {
      filteredData = this.enhancedKeywordFilter(data, query);
    }

    // 검색 기록에 추가
    if (query && query.trim()) {
      this.addToSearchHistory(query);
    }

    return {
      results: filteredData,
      total: filteredData.length,
      query,
      filters
    };
  }

  // 향상된 키워드 필터링
  enhancedKeywordFilter(diaries, query) {
    const keywords = query.toLowerCase().split(/\s+/);

    return diaries.map(diary => {
      const content = diary.content.toLowerCase();
      let score = 0;
      let matchedKeywords = [];

      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = content.match(regex);
        if (matches) {
          score += matches.length;
          matchedKeywords.push(keyword);
        }
      });

      return {
        ...diary,
        searchScore: score,
        matchedKeywords
      };
    })
    .filter(diary => diary.searchScore > 0)
    .sort((a, b) => b.searchScore - a.searchScore);
  }

  // 태그 검색
  async searchByTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return [];

    const { supabase } = await import('./supabase.js');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('로그인이 필요합니다.');

    // 태그가 포함된 일기 검색 (태그는 content에 #hashtag 형태로 저장)
    const tagPattern = tags.map(tag => `#${tag}`).join('|');

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', user.id)
      .textSearch('content', tagPattern)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.filter(diary => {
      return tags.some(tag =>
        diary.content.toLowerCase().includes(`#${tag.toLowerCase()}`)
      );
    });
  }

  // 유사한 감정의 일기 찾기
  async findSimilarEmotions(targetEmotion, limit = 5) {
    const { supabase } = await import('./supabase.js');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('emotion', targetEmotion)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // 날짜 범위 내 감정 분석
  async analyzeEmotionsByDateRange(startDate, endDate) {
    const { supabase } = await import('./supabase.js');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('diaries')
      .select('emotion, created_at, content')
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // 감정별 통계
    const emotionCounts = {};
    const dailyEmotions = {};

    data.forEach(diary => {
      const emotion = diary.emotion;
      const date = diary.created_at.split('T')[0];

      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;

      if (!dailyEmotions[date]) {
        dailyEmotions[date] = [];
      }
      dailyEmotions[date].push(emotion);
    });

    return {
      total: data.length,
      emotionCounts,
      dailyEmotions,
      entries: data
    };
  }

  // 검색 제안 생성
  generateSearchSuggestions(query) {
    const suggestions = [];

    // 검색 기록에서 유사한 검색어 찾기
    const historyMatches = this.searchHistory.filter(item =>
      item.toLowerCase().includes(query.toLowerCase())
    );
    suggestions.push(...historyMatches.slice(0, 3));

    // 일반적인 감정 키워드 제안
    const emotionKeywords = [
      '행복', '기쁨', '만족', '즐거움',
      '슬픔', '우울', '아쉬움', '실망',
      '화남', '분노', '짜증', '억울함',
      '불안', '걱정', '스트레스', '긴장',
      '평온', '차분', '안정', '여유'
    ];

    const keywordMatches = emotionKeywords.filter(keyword =>
      keyword.includes(query)
    );
    suggestions.push(...keywordMatches.slice(0, 3));

    // 중복 제거 및 최대 5개까지
    return [...new Set(suggestions)].slice(0, 5);
  }

  // 검색 기록 관리
  addToSearchHistory(query) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // 중복 제거
    this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);

    // 맨 앞에 추가
    this.searchHistory.unshift(trimmedQuery);

    // 최대 개수 제한
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }

    localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
  }

  getSearchHistory() {
    return this.searchHistory;
  }

  clearSearchHistory() {
    this.searchHistory = [];
    localStorage.removeItem('search_history');
  }

  // 고급 검색 UI 생성
  createAdvancedSearchUI() {
    return `
      <div class="advanced-search">
        <h3>고급 검색</h3>

        <div class="search-field">
          <label for="search-query">키워드</label>
          <input type="text" id="search-query" placeholder="검색할 내용을 입력하세요">
          <div id="search-suggestions" class="search-suggestions"></div>
        </div>

        <div class="search-field">
          <label for="emotion-filter">감정</label>
          <select id="emotion-filter">
            <option value="all">모든 감정</option>
            <option value="happy">😊 행복</option>
            <option value="sad">😢 슬픔</option>
            <option value="angry">😠 분노</option>
            <option value="anxious">😟 불안</option>
            <option value="neutral">😐 보통</option>
          </select>
        </div>

        <div class="search-field">
          <label for="start-date">시작 날짜</label>
          <input type="date" id="start-date">
        </div>

        <div class="search-field">
          <label for="end-date">종료 날짜</label>
          <input type="date" id="end-date">
        </div>

        <div class="search-field">
          <label for="sort-by">정렬</label>
          <select id="sort-by">
            <option value="created_at">작성일</option>
            <option value="emotion">감정</option>
          </select>
          <select id="sort-order">
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>
        </div>

        <div class="search-actions">
          <button onclick="diarySearch.performAdvancedSearch()">검색</button>
          <button onclick="diarySearch.clearSearch()">초기화</button>
        </div>

        <div class="search-history">
          <h4>최근 검색</h4>
          <div id="search-history-list"></div>
          <button onclick="diarySearch.clearSearchHistory()">기록 삭제</button>
        </div>
      </div>
    `;
  }

  // 고급 검색 실행
  async performAdvancedSearch() {
    const query = document.getElementById('search-query').value;
    const filters = {
      emotion: document.getElementById('emotion-filter').value,
      startDate: document.getElementById('start-date').value,
      endDate: document.getElementById('end-date').value,
      sortBy: document.getElementById('sort-by').value,
      sortOrder: document.getElementById('sort-order').value
    };

    try {
      const results = await this.searchDiaries(query, filters);
      this.displaySearchResults(results);
    } catch (error) {
      console.error('검색 실패:', error);
      alert('검색 중 오류가 발생했습니다.');
    }
  }

  // 검색 결과 표시
  displaySearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;

    if (results.total === 0) {
      container.innerHTML = '<p class="no-results">검색 결과가 없습니다.</p>';
      return;
    }

    const resultHTML = results.results.map(diary => `
      <div class="search-result-item">
        <div class="result-header">
          <span class="emotion">${this.getEmotionLabel(diary.emotion)}</span>
          <span class="date">${new Date(diary.created_at).toLocaleDateString()}</span>
          ${diary.searchScore ? `<span class="score">관련도: ${diary.searchScore}</span>` : ''}
        </div>
        <div class="result-content">
          ${this.highlightKeywords(diary.content, results.query)}
        </div>
        ${diary.matchedKeywords ?
          `<div class="matched-keywords">
            매칭 키워드: ${diary.matchedKeywords.join(', ')}
          </div>` : ''
        }
      </div>
    `).join('');

    container.innerHTML = `
      <div class="search-results-header">
        <h3>검색 결과 (${results.total}개)</h3>
      </div>
      <div class="search-results-list">
        ${resultHTML}
      </div>
    `;
  }

  // 키워드 하이라이트
  highlightKeywords(text, query) {
    if (!query) return text;

    const keywords = query.split(/\s+/);
    let highlightedText = text;

    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText.length > 200 ?
      highlightedText.substring(0, 200) + '...' :
      highlightedText;
  }

  // 감정 라벨 가져오기
  getEmotionLabel(emotion) {
    const labels = {
      happy: '😊 행복',
      sad: '😢 슬픔',
      angry: '😠 분노',
      anxious: '😟 불안',
      neutral: '😐 보통'
    };
    return labels[emotion] || emotion;
  }

  // 검색 초기화
  clearSearch() {
    document.getElementById('search-query').value = '';
    document.getElementById('emotion-filter').value = 'all';
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('sort-by').value = 'created_at';
    document.getElementById('sort-order').value = 'desc';

    const container = document.getElementById('search-results');
    if (container) {
      container.innerHTML = '';
    }
  }
}

// 전역 인스턴스
export const diarySearch = new DiarySearch();