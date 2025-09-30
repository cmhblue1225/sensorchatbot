// Phase 2: 익명 감정 커뮤니티 클라이언트

import { supabase } from './supabase.js';

export class AnonymousCommunity {
  constructor() {
    this.posts = [];
    this.myPosts = [];
    this.currentFilter = '';
    this.selectedEmotion = '';
    this.myAnonymousId = '';
    this.isLoading = false;

    this.initializeUI();
    this.loadPosts();
  }

  initializeUI() {
    this.setupTabNavigation();
    this.setupEventListeners();
    this.setupEmotionFilters();
  }

  setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 활성 탭 변경
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        document.getElementById(`${targetTab}-tab`).classList.add('active');

        // 탭별 데이터 로드
        if (targetTab === 'explore') {
          this.loadPosts();
        } else if (targetTab === 'my-posts') {
          this.loadMyPosts();
        }
      });
    });
  }

  setupEventListeners() {
    // 글 작성 버튼
    const submitBtn = document.getElementById('post-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', this.createPost.bind(this));
    }

    // 플로팅 작성 버튼
    const floatingBtn = document.getElementById('floating-compose');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', () => {
        this.switchToTab('compose');
      });
    }

    // 감정 선택 버튼들
    const emotionBtns = document.querySelectorAll('.emotion-btn');
    emotionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        emotionBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedEmotion = btn.dataset.emotion;
      });
    });

    // 더 보기 버튼
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', this.loadMorePosts.bind(this));
    }

    // 게시물 액션 이벤트 위임
    document.addEventListener('click', this.handlePostActions.bind(this));
  }

  setupEmotionFilters() {
    const filterBtns = document.querySelectorAll('.emotion-filter');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.emotion;
        this.loadPosts();
      });
    });
  }

  switchToTab(tabName) {
    const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabBtn) {
      tabBtn.click();
    }
  }

  async loadPosts() {
    if (this.isLoading) return;

    this.isLoading = true;
    const container = document.getElementById('posts-container');
    if (container) {
      container.innerHTML = '<div class="loading"><p>게시물을 불러오는 중...</p></div>';
    }

    try {
      // 로그인 상태 확인 (옵셔널)
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      // 익명 ID 생성 (일관된 해싱)
      this.myAnonymousId = currentUserId ?
        'anon-' + currentUserId.slice(0, 8) :
        'anon-guest-' + Math.random().toString(36).substr(2, 8);

      // shared_diaries 테이블에서 데이터 가져오기
      let query = supabase
        .from('shared_diaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // 감정 필터 적용
      if (this.currentFilter) {
        query = query.eq('emotion', this.currentFilter);
      }

      const { data: sharedDiaries, error } = await query;

      if (error) {
        throw new Error('게시물 로드 실패: ' + error.message);
      }

      // shared_diaries 데이터를 커뮤니티 포스트 형식으로 변환
      this.posts = sharedDiaries.map(diary => ({
        id: diary.id,
        anonymous_id: 'anon-' + diary.user_id.slice(0, 8),
        emotion_category: diary.emotion,
        content: diary.content,
        feedback: diary.feedback,
        music: diary.music,
        tags: diary.ai_generated_tags || ['일상', '감정'],
        is_seeking_advice: false, // 기본값
        like_count: diary.likes || 0,
        comment_count: 0, // 추후 구현
        view_count: Math.floor(Math.random() * 50) + 10, // 임시값
        created_at: diary.created_at
      }));

      this.displayPosts();
      this.updateAnonymousId();

    } catch (error) {
      console.error('게시물 로드 오류:', error);
      // Fallback to mock data if database fails
      this.posts = this.generateMockPosts();
      this.displayPosts();
      this.showNotification('일부 게시물을 불러오는데 문제가 있었습니다.', 'warning');
    } finally {
      this.isLoading = false;
    }
  }

  generateMockPosts() {
    const emotions = ['happy', 'sad', 'angry', 'anxious', 'neutral'];
    const contents = [
      '오늘 정말 좋은 일이 있었어요. 힘든 시기를 보내고 있는 분들도 희망을 잃지 마세요.',
      '요즘 너무 외로워요. 비슷한 감정을 느끼는 분들이 계실까요?',
      '불안한 마음이 들 때 어떻게 대처하시나요? 좋은 방법이 있다면 공유해주세요.',
      '작은 것에도 감사함을 느끼는 요즘입니다. 여러분은 어떤 것에 감사하시나요?',
      '힘든 하루였지만 내일은 더 나아질 거라고 믿어요.',
      '스트레스가 너무 많아서 잠을 못 자고 있어요. 어떻게 해야 할까요?'
    ];

    return Array.from({ length: 8 }, (_, i) => ({
      id: `mock_${i}`,
      anonymous_id: i % 3 === 0 ? 'anon_demo_user' : `anon_user_${i}`,
      emotion_category: emotions[i % emotions.length],
      content: contents[i % contents.length],
      tags: ['일상', '감정', '공감'],
      is_seeking_advice: i % 3 === 0,
      like_count: Math.floor(Math.random() * 20),
      comment_count: Math.floor(Math.random() * 10),
      view_count: Math.floor(Math.random() * 100) + 20,
      created_at: new Date(Date.now() - i * 3600000).toISOString()
    }));
  }

  updateAnonymousId() {
    const idElement = document.getElementById('my-anonymous-id');
    if (idElement) {
      idElement.textContent = this.myAnonymousId || '알 수 없음';
    }
  }

  displayPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    if (this.posts.length === 0) {
      container.innerHTML = `
        <div class="no-posts">
          <p>표시할 게시물이 없습니다.</p>
          <p>첫 번째 글을 작성해보세요!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.posts.map(post => this.renderPostCard(post)).join('');
  }

  renderPostCard(post) {
    const timeAgo = this.getTimeAgo(post.created_at);
    const isMyPost = post.anonymous_id === this.myAnonymousId;
    const emotionInfo = this.getEmotionInfo(post.emotion_category);

    return `
      <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in ${post.is_seeking_advice ? 'border-l-4 border-yellow-400' : ''}" data-post-id="${post.id}">
        <!-- Post Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              ${post.anonymous_id.slice(-2).toUpperCase()}
            </div>
            <div>
              <div class="font-semibold ${isMyPost ? 'text-indigo-600' : 'text-gray-800'}">
                ${isMyPost ? '🫵 나' : post.anonymous_id}
              </div>
              <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style="background-color: ${emotionInfo.color}20; color: ${emotionInfo.color};">
                ${emotionInfo.icon} ${emotionInfo.name}
              </div>
            </div>
          </div>
          <div class="text-right text-sm text-gray-500">
            <div>${timeAgo}</div>
            ${post.is_seeking_advice ? '<div class="text-yellow-600 text-xs mt-1">💡 조언 구함</div>' : ''}
          </div>
        </div>

        <!-- Post Content -->
        <div class="text-gray-800 leading-relaxed mb-4 text-base">
          ${post.content}
        </div>

        <!-- AI Feedback -->
        ${post.feedback && post.feedback !== '감정 분석 실패' ? `
          <div class="ai-feedback mb-4">
            <details class="group">
              <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors flex items-center space-x-2">
                <span>🤖 AI 피드백 보기</span>
                <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </summary>
              <div class="feedback-content mt-3 text-sm leading-relaxed">${post.feedback}</div>
            </details>
          </div>
        ` : ''}

        <!-- Music Recommendation -->
        ${post.music ? `
          <div class="music-recommendation mb-4">
            <div class="music-header text-sm font-medium mb-2">🎵 추천 음악</div>
            <div class="music-content">
              <a href="${post.music}" target="_blank" class="music-link inline-block">🎶 음악 들으러 가기</a>
            </div>
          </div>
        ` : ''}

        <!-- Tags -->
        ${post.tags && post.tags.length > 0 ? `
          <div class="flex flex-wrap gap-2 mb-4">
            ${post.tags.map(tag => `
              <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #${tag}
              </span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Post Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
          <div class="flex items-center space-x-6 text-sm text-gray-500">
            <div class="flex items-center space-x-1">
              <span>👁️</span>
              <span>${post.view_count || 0}</span>
            </div>
            <div class="flex items-center space-x-1">
              <span>❤️</span>
              <span>${post.like_count || 0}</span>
            </div>
            <div class="flex items-center space-x-1">
              <span>💬</span>
              <span>${post.comment_count || 0}</span>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <button class="action-btn px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200" data-action="like" data-post-id="${post.id}">
              ❤️ 좋아요
            </button>
            <button class="action-btn px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all duration-200" data-action="comment" data-post-id="${post.id}">
              💬 댓글
            </button>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="comments-section mt-4 pt-4 border-t border-gray-100 hidden" id="comments-${post.id}">
          <div class="mb-3">
            <textarea class="comment-input w-full p-3 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 resize-none"
                     placeholder="따뜻한 댓글을 남겨주세요..."
                     data-post-id="${post.id}"
                     rows="3"></textarea>
          </div>
          <div class="flex justify-end mb-3">
            <button class="comment-submit-btn bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200" data-post-id="${post.id}">
              댓글 작성
            </button>
          </div>
          <div class="comments-list space-y-3" id="comments-list-${post.id}">
            <!-- 댓글들이 여기에 로드됩니다 -->
          </div>
        </div>
      </div>
    `;
  }

  getEmotionInfo(emotionKey) {
    const emotions = {
      // 5가지 표준 감정에 맞춰 수정
      happy: { name: '행복', icon: '😊', color: '#10B981' },
      sad: { name: '슬픔', icon: '😢', color: '#3B82F6' },
      angry: { name: '분노', icon: '😠', color: '#EF4444' },
      anxious: { name: '불안', icon: '😟', color: '#F59E0B' },
      neutral: { name: '보통', icon: '😐', color: '#6B7280' },
      // 레거시 감정들도 매핑
      joy: { name: '기쁨', icon: '😄', color: '#10B981' },
      sadness: { name: '슬픔', icon: '😢', color: '#3B82F6' },
      anxiety: { name: '불안', icon: '😰', color: '#F59E0B' },
      anger: { name: '분노', icon: '😠', color: '#EF4444' },
      contentment: { name: '만족', icon: '😊', color: '#10B981' },
      loneliness: { name: '외로움', icon: '😞', color: '#3B82F6' },
      hope: { name: '희망', icon: '🌟', color: '#10B981' },
      frustration: { name: '좌절', icon: '😤', color: '#EF4444' },
      calm: { name: '평온', icon: '😌', color: '#6B7280' },
      confused: { name: '혼란', icon: '😕', color: '#6B7280' }
    };
    return emotions[emotionKey] || { name: emotionKey, icon: '😐', color: '#6B7280' };
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now - date;

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return '방금 전';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}분 전`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}시간 전`;
    } else {
      return `${Math.floor(diff / day)}일 전`;
    }
  }

  async handlePostActions(event) {
    const action = event.target.dataset.action;
    const postId = event.target.dataset.postId;

    if (!action || !postId) return;

    if (action === 'like') {
      await this.likePost(postId);
    } else if (action === 'comment') {
      this.toggleComments(postId);
    }

    // 댓글 작성 버튼
    if (event.target.classList.contains('comment-submit-btn')) {
      await this.submitComment(postId);
    }
  }

  async likePost(postId) {
    try {
      // Supabase를 통해 직접 좋아요 업데이트
      const { data: currentPost, error: fetchError } = await supabase
        .from('shared_diaries')
        .select('likes')
        .eq('id', postId)
        .single();

      if (fetchError) {
        throw new Error('게시물을 찾을 수 없습니다.');
      }

      const newLikeCount = (currentPost.likes || 0) + 1;

      const { error: updateError } = await supabase
        .from('shared_diaries')
        .update({ likes: newLikeCount })
        .eq('id', postId);

      if (updateError) {
        throw new Error('좋아요 업데이트 실패');
      }

      // UI 업데이트
      const likeBtn = document.querySelector(`[data-action="like"][data-post-id="${postId}"]`);
      if (likeBtn) {
        likeBtn.classList.add('bg-red-100', 'text-red-600');
        likeBtn.classList.remove('hover:text-red-500', 'hover:bg-red-50');
        likeBtn.disabled = true; // 중복 클릭 방지

        // 좋아요 개수 업데이트 (새로운 구조에 맞게 수정)
        const postCard = likeBtn.closest('[data-post-id]');
        const likeCountElement = postCard.querySelector('.flex.items-center.space-x-1:nth-child(2) span:last-child');
        if (likeCountElement) {
          likeCountElement.textContent = newLikeCount;
        }
      }

      this.showNotification('좋아요를 눌렀습니다!', 'success');

    } catch (error) {
      console.error('좋아요 오류:', error);
      this.showNotification('좋아요에 실패했습니다. ' + error.message, 'error');
    }
  }

  toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
      commentsSection.classList.toggle('hidden');

      if (!commentsSection.classList.contains('hidden')) {
        this.loadComments(postId);
      }
    }
  }

  async loadComments(postId) {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return;

      // 로컬 환경에서는 모의 댓글 표시
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        const mockComments = [
          {
            id: '1',
            anonymous_id: 'anon_user_1',
            content: '정말 공감됩니다. 함께 힘내요!',
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        this.displayComments(postId, mockComments);
        return;
      }

      const response = await fetch(`/.netlify/functions/anonymous-community?action=comments&postId=${postId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('댓글 로드 실패');
      }

      const data = await response.json();
      this.displayComments(postId, data.comments || []);

    } catch (error) {
      console.error('댓글 로드 오류:', error);
    }
  }

  displayComments(postId, comments) {
    const commentsList = document.getElementById(`comments-list-${postId}`);
    if (!commentsList) return;

    if (comments.length === 0) {
      commentsList.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">첫 번째 댓글을 남겨주세요!</p>';
      return;
    }

    commentsList.innerHTML = comments.map(comment => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">${comment.anonymous_id === this.myAnonymousId ? '나' : comment.anonymous_id}</span>
          <span class="comment-time">${this.getTimeAgo(comment.created_at)}</span>
        </div>
        <div class="comment-content">${comment.content}</div>
      </div>
    `).join('');
  }

  async submitComment(postId) {
    const commentInput = document.querySelector(`textarea[data-post-id="${postId}"]`);
    if (!commentInput) return;

    const content = commentInput.value.trim();
    if (!content) {
      this.showNotification('댓글 내용을 입력해주세요.', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // 로컬 환경에서는 시뮬레이션
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        commentInput.value = '';
        this.showNotification('댓글이 작성되었습니다!', 'success');
        // 댓글 목록 새로고침
        setTimeout(() => this.loadComments(postId), 500);
        return;
      }

      const response = await fetch('/.netlify/functions/anonymous-community', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_comment',
          postId: postId,
          content: content
        })
      });

      if (!response.ok) {
        throw new Error('댓글 작성 실패');
      }

      commentInput.value = '';
      this.showNotification('댓글이 작성되었습니다!', 'success');
      this.loadComments(postId);

    } catch (error) {
      console.error('댓글 작성 오류:', error);
      this.showNotification('댓글 작성에 실패했습니다.', 'error');
    }
  }

  async createPost() {
    // 로그인 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      this.showNotification('글 작성은 로그인 후 이용할 수 있습니다.', 'warning');
      window.location.href = 'login.html';
      return;
    }

    const content = document.getElementById('new-post-content').value.trim();
    const seekingAdvice = document.getElementById('seeking-advice').checked;

    if (!content) {
      this.showNotification('글 내용을 입력해주세요.', 'warning');
      return;
    }

    if (!this.selectedEmotion) {
      this.showNotification('현재 감정을 선택해주세요.', 'warning');
      return;
    }

    const submitBtn = document.getElementById('post-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '게시 중...';
    }

    try {
      // Supabase를 통해 직접 shared_diaries 테이블에 저장
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // shared_diaries 테이블에 새 게시물 삽입
      const { data, error } = await supabase
        .from('shared_diaries')
        .insert({
          user_id: userId,
          emotion: this.selectedEmotion,
          content: content,
          feedback: null, // 커뮤니티에서 직접 작성한 글은 AI 피드백 없음
          music: null,
          likes: 0,
          ai_generated_tags: ['커뮤니티', '익명', '감정']
        })
        .select()
        .single();

      if (error) {
        throw new Error('게시물 저장 실패: ' + error.message);
      }

      // 성공 처리
      document.getElementById('new-post-content').value = '';
      document.getElementById('seeking-advice').checked = false;
      document.querySelectorAll('.emotion-btn').forEach(btn => btn.classList.remove('selected'));
      this.selectedEmotion = '';

      this.showNotification('글이 성공적으로 게시되었습니다!', 'success');
      this.switchToTab('explore');
      this.loadPosts(); // 새 글 포함하여 목록 새로고침

    } catch (error) {
      console.error('게시물 작성 오류:', error);
      this.showNotification(error.message || '게시에 실패했습니다.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '게시하기';
      }
    }
  }

  async loadMyPosts() {
    const container = document.getElementById('my-posts-container');
    if (!container) return;

    container.innerHTML = '<div class="loading"><p>내 글을 불러오는 중...</p></div>';

    try {
      // 로그인 상태 확인 (옵셔널)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 로컬 환경이거나 로그인하지 않은 경우 모의 데이터 사용
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:' ||
                     !token;

      if (isLocal) {
        this.myPosts = this.generateMockPosts().filter(post =>
          post.anonymous_id === (this.myAnonymousId || 'anon_demo_user'));
        this.displayMyPosts();
        return;
      }

      const response = await fetch('/.netlify/functions/anonymous-community?action=my_posts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('내 글 로드 실패');
      }

      const data = await response.json();
      this.myPosts = data.posts || [];
      this.displayMyPosts();

    } catch (error) {
      console.error('내 글 로드 오류:', error);
      this.showNotification('내 글을 불러오는데 실패했습니다.', 'error');
      this.displayError('내 글을 불러올 수 없습니다.', 'my-posts-container');
    }
  }

  displayMyPosts() {
    const container = document.getElementById('my-posts-container');
    if (!container) return;

    if (this.myPosts.length === 0) {
      container.innerHTML = `
        <div class="no-posts">
          <p>아직 작성한 글이 없습니다.</p>
          <p>첫 번째 글을 작성해보세요!</p>
          <button class="btn btn-primary" onclick="anonymousCommunity.switchToTab('compose')">글 작성하기</button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.myPosts.map(post => this.renderPostCard(post)).join('');
  }

  displayError(message, containerId = 'posts-container') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="no-posts">
          <p>${message}</p>
          <button class="btn btn-outline" onclick="location.reload()">새로고침</button>
        </div>
      `;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  async loadMorePosts() {
    if (this.isLoading) return;

    this.isLoading = true;
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.textContent = '로딩 중...';
      loadMoreBtn.disabled = true;
    }

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        this.showNotification('로그인이 필요합니다.', 'warning');
        return;
      }

      // 로컬 환경에서는 더 보기 기능 시뮬레이션
      const isLocal = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

      if (isLocal) {
        // 추가 모의 데이터 생성
        const moreMockPosts = this.generateMockPosts().slice(5, 10);
        this.posts.push(...moreMockPosts);
        this.displayPosts();

        // 더 이상 로드할 데이터가 없다고 가정
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
          loadMoreContainer.style.display = 'none';
        }
        return;
      }

      const offset = this.posts.length;
      const url = `/.netlify/functions/anonymous-community?action=get_posts&offset=${offset}&limit=10${this.currentFilter ? `&emotion=${this.currentFilter}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('게시물 로딩에 실패했습니다.');
      }

      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        this.posts.push(...data.posts);
        this.displayPosts();

        // 더 이상 로드할 데이터가 없으면 버튼 숨기기
        if (data.posts.length < 10) {
          const loadMoreContainer = document.getElementById('load-more-container');
          if (loadMoreContainer) {
            loadMoreContainer.style.display = 'none';
          }
        }
      } else {
        const loadMoreContainer = document.getElementById('load-more-container');
        if (loadMoreContainer) {
          loadMoreContainer.style.display = 'none';
        }
        this.showNotification('더 이상 게시물이 없습니다.', 'info');
      }

    } catch (error) {
      console.error('더 보기 로딩 오류:', error);
      this.showNotification('게시물 로딩에 실패했습니다.', 'error');
    } finally {
      this.isLoading = false;
      if (loadMoreBtn) {
        loadMoreBtn.textContent = '더 보기';
        loadMoreBtn.disabled = false;
      }
    }
  }
}

// 전역으로 내보내기
window.AnonymousCommunity = AnonymousCommunity;