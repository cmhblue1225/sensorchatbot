// AI 대시보드 및 인사이트 표시
export class AIDashboard {
  constructor() {
    // Chart.js는 stats.html에서 이미 로드됨
    console.log('AI Dashboard initialized');
  }

  // 차트 라이브러리 초기화
  initializeCharts() {
    // Chart.js가 없으면 CDN에서 로드
    if (typeof Chart === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => {
        console.log('Chart.js loaded');
      };
      document.head.appendChild(script);
    } else {
      console.log('Chart.js already available');
    }
  }

  // 사용자 감정 프로필 로드 (stats.html에서 직접 호출됨)
  async loadUserEmotionProfile() {
    console.log('loadUserEmotionProfile 메서드는 stats.html에서 직접 처리됩니다.');
  }

  // AI 인사이트 생성
  async generateAIInsights(emotionData) {
    try {
      const { supabase } = await import('./supabase.js');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 감정 데이터 기반으로 AI 요약 생성
      const response = await fetch('/.netlify/functions/emotion-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emotions: emotionData.recentEmotions || []
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.displayAIInsights(result.summary);
      }
    } catch (error) {
      console.error('AI 인사이트 생성 실패:', error);
    }
  }

  // AI 인사이트 표시
  displayAIInsights(summary) {
    const container = document.getElementById('ai-insights-container');
    if (!container) return;

    container.innerHTML = `
      <div class="ai-insights-card">
        <div class="ai-insights-header">
          <h3>🧠 AI 감정 분석 인사이트</h3>
          <span class="ai-badge">GPT-4 분석</span>
        </div>
        <div class="ai-insights-content">
          <p>${summary}</p>
        </div>
        <div class="ai-insights-actions">
          <button onclick="aiDashboard.getDetailedAnalysis()" class="btn-ai-detail">
            📊 상세 분석 보기
          </button>
          <button onclick="aiDashboard.getRecommendations()" class="btn-ai-recommend">
            💡 맞춤 추천 받기
          </button>
        </div>
      </div>
    `;
  }

  // 감정 프로필 렌더링
  renderEmotionProfile(data) {
    const container = document.getElementById('emotion-profile-container');
    if (!container) return;

    const totalEntries = data.totalEntries || 0;
    const emotionCounts = data.emotionCounts || {};
    const emotionPercentages = data.emotionPercentages || {};

    // 주요 감정 추출
    const topEmotions = Object.entries(emotionPercentages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    container.innerHTML = `
      <div class="emotion-profile-card">
        <div class="profile-header">
          <h3>📊 나의 감정 프로필</h3>
          <div class="total-entries">총 ${totalEntries}개의 일기</div>
        </div>

        <div class="top-emotions">
          <h4>주요 감정</h4>
          <div class="emotion-badges">
            ${topEmotions.map(([emotion, percentage]) => `
              <div class="emotion-badge ${emotion}">
                <span class="emotion-icon">${this.getEmotionIcon(emotion)}</span>
                <span class="emotion-name">${this.getEmotionLabel(emotion)}</span>
                <span class="emotion-percentage">${percentage}%</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="emotion-chart-container">
          <canvas id="emotion-pie-chart" width="300" height="300"></canvas>
        </div>

        <div class="mood-trends">
          <h4>최근 7일 감정 변화</h4>
          <canvas id="mood-trend-chart" width="400" height="200"></canvas>
        </div>
      </div>
    `;

    // 차트 그리기
    this.drawEmotionChart(emotionPercentages);
    this.drawMoodTrendChart(data.recentEmotions || []);
  }

  // 감정 파이 차트 그리기
  drawEmotionChart(emotionPercentages) {
    const ctx = document.getElementById('emotion-pie-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    const emotions = Object.entries(emotionPercentages)
      .filter(([, percentage]) => percentage > 0);

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: emotions.map(([emotion]) => this.getEmotionLabel(emotion)),
        datasets: [{
          data: emotions.map(([, percentage]) => percentage),
          backgroundColor: emotions.map(([emotion]) => this.getEmotionColor(emotion)),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed}%`;
              }
            }
          }
        }
      }
    });
  }

  // 기분 추세 차트 그리기
  drawMoodTrendChart(recentEmotions) {
    const ctx = document.getElementById('mood-trend-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    // 최근 7일 데이터 준비
    const last7Days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        mood: this.calculateDayMood(recentEmotions, date)
      });
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: last7Days.map(d => d.date),
        datasets: [{
          label: '기분 점수',
          data: last7Days.map(d => d.mood),
          borderColor: '#74c0fc',
          backgroundColor: 'rgba(116, 192, 252, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#74c0fc',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            min: -100,
            max: 100,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            ticks: {
              callback: function(value) {
                if (value > 50) return '😊 긍정적';
                if (value > 0) return '😐 보통';
                if (value > -50) return '😔 우울함';
                return '😢 매우 우울함';
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                let emoji = '😐';
                if (value > 50) emoji = '😊';
                else if (value > 0) emoji = '🙂';
                else if (value > -50) emoji = '😔';
                else emoji = '😢';

                return `${emoji} 기분 점수: ${value}`;
              }
            }
          }
        }
      }
    });
  }

  // 특정 날짜의 평균 기분 계산
  calculateDayMood(emotions, targetDate) {
    const dayEmotions = emotions.filter(emotion => {
      const emotionDate = new Date(emotion.date);
      return emotionDate.toDateString() === targetDate.toDateString();
    });

    if (dayEmotions.length === 0) return 0;

    const moodValues = dayEmotions.map(emotion => this.emotionToMoodScore(emotion.emotion));
    return moodValues.reduce((sum, mood) => sum + mood, 0) / moodValues.length;
  }

  // 감정을 기분 점수로 변환
  emotionToMoodScore(emotion) {
    const moodMap = {
      happy: 70, sad: -60, angry: -70, anxious: -50, neutral: 0,
      excited: 80, peaceful: 40, confused: -20,
      joy: 80, contentment: 60, gratitude: 70, love: 85,
      grief: -80, frustration: -55, fear: -75, loneliness: -60
    };
    return moodMap[emotion] || 0;
  }

  // 상세 분석 모달 표시
  async getDetailedAnalysis() {
    const modalHTML = `
      <div class="ai-modal-backdrop" onclick="this.remove()">
        <div class="ai-modal" onclick="event.stopPropagation()">
          <div class="ai-modal-header">
            <h3>🔍 상세 감정 분석</h3>
            <button class="close-btn" onclick="this.closest('.ai-modal-backdrop').remove()">×</button>
          </div>
          <div class="ai-modal-body">
            <div class="loading">분석 중...</div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    try {
      // 로컬 개발 환경 감지
      const isLocalDev = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.port;

      if (isLocalDev) {
        // 로컬 개발용 모의 상세 분석 데이터
        const mockData = {
          complexity_score: 0.7,
          keywords: ['감정', '일기', '분석', '행복', '성장'],
          ai_insights: '현재 로컬 개발 환경에서 실행 중입니다. 실제 배포 환경에서는 GPT-4o의 상세한 감정 분석을 받아볼 수 있습니다.',
          personalized_advice: '일기를 꾸준히 작성하여 자신의 감정 패턴을 파악해보세요. 감정의 변화를 인식하는 것만으로도 큰 도움이 됩니다.',
          similar_entries: [
            {
              created_at: new Date().toISOString(),
              emotion: 'happy',
              content: '오늘은 정말 좋은 하루였습니다. 새로운 것을 배우고 성장하는 기분이에요.'
            }
          ]
        };
        this.displayDetailedAnalysis(mockData);
        return;
      }

      const { supabase } = await import('./supabase.js');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        this.displayDetailedAnalysis({
          ai_insights: '로그인이 필요합니다.',
          personalized_advice: '로그인 후 상세 분석을 받아보세요.'
        });
        return;
      }

      const response = await fetch('/.netlify/functions/advanced-emotion-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: '최근 일기들을 종합적으로 분석해주세요.',
          analysisType: 'detailed_summary'
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.displayDetailedAnalysis(data);
      } else {
        // 오류 시 기본 분석 표시
        this.displayDetailedAnalysis({
          ai_insights: '현재 AI 분석 서비스에 일시적인 문제가 있습니다.',
          personalized_advice: '잠시 후 다시 시도해주세요.'
        });
      }
    } catch (error) {
      console.error('상세 분석 실패:', error);
      this.displayDetailedAnalysis({
        ai_insights: '분석 중 오류가 발생했습니다.',
        personalized_advice: '네트워크 상태를 확인하고 다시 시도해주세요.'
      });
    }
  }

  // 상세 분석 결과 표시
  displayDetailedAnalysis(data) {
    const modalBody = document.querySelector('.ai-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="detailed-analysis">
        <div class="analysis-section">
          <h4>📈 감정 복잡도</h4>
          <div class="complexity-meter">
            <div class="meter-fill" style="width: ${data.complexity_score * 100}%"></div>
          </div>
          <p>복잡도: ${Math.round(data.complexity_score * 100)}%</p>
        </div>

        <div class="analysis-section">
          <h4>🎯 핵심 키워드</h4>
          <div class="keywords">
            ${(data.keywords || []).map(keyword =>
              `<span class="keyword-tag">${keyword}</span>`
            ).join('')}
          </div>
        </div>

        <div class="analysis-section">
          <h4>💡 AI 인사이트</h4>
          <p class="ai-insight">${data.ai_insights || '분석 중...'}</p>
        </div>

        <div class="analysis-section">
          <h4>🎯 맞춤 조언</h4>
          <p class="personalized-advice">${data.personalized_advice || '조언 생성 중...'}</p>
        </div>

        ${data.similar_entries && data.similar_entries.length > 0 ? `
          <div class="analysis-section">
            <h4>📚 유사한 감정의 일기들</h4>
            <div class="similar-entries">
              ${data.similar_entries.slice(0, 3).map(entry => `
                <div class="similar-entry">
                  <div class="entry-date">${new Date(entry.created_at).toLocaleDateString()}</div>
                  <div class="entry-emotion">${this.getEmotionIcon(entry.emotion)} ${this.getEmotionLabel(entry.emotion)}</div>
                  <div class="entry-preview">${entry.content.substring(0, 100)}...</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // 맞춤 추천 받기
  async getRecommendations() {
    const modalHTML = `
      <div class="ai-modal-backdrop" onclick="this.remove()">
        <div class="ai-modal" onclick="event.stopPropagation()">
          <div class="ai-modal-header">
            <h3>💡 AI 맞춤 추천</h3>
            <button class="close-btn" onclick="this.closest('.ai-modal-backdrop').remove()">×</button>
          </div>
          <div class="ai-modal-body">
            <div class="loading">추천 생성 중...</div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    try {
      // 로컬 개발 환경 감지
      const isLocalDev = window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1' ||
                        window.location.port;

      let recentEmotion = 'neutral';
      let recommendations;

      if (isLocalDev) {
        // 로컬 개발용 기본 추천
        recentEmotion = 'happy'; // 기본값
        recommendations = await this.generateRecommendations(recentEmotion);
      } else {
        // 사용자의 최근 감정 상태를 기반으로 추천 생성
        recentEmotion = await this.getUserRecentEmotion();
        recommendations = await this.generateRecommendations(recentEmotion);
      }

      this.displayRecommendations(recommendations);
    } catch (error) {
      console.error('추천 생성 실패:', error);
      // 오류 시 기본 추천 표시
      const fallbackRecommendations = await this.generateRecommendations('neutral');
      this.displayRecommendations(fallbackRecommendations);
    }
  }

  // 최근 감정 상태 가져오기
  async getUserRecentEmotion() {
    try {
      const { supabase } = await import('./supabase.js');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('/.netlify/functions/emotion-summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.recentEmotions?.[0]?.emotion || 'neutral';
      }
    } catch (error) {
      console.error('최근 감정 조회 실패:', error);
    }
    return 'neutral';
  }

  // 추천 생성
  async generateRecommendations(emotion) {
    // 기본 추천 데이터
    const baseRecommendations = {
      music: ['잔잔한 피아노 음악', '자연의 소리', '좋아하는 플레이리스트'],
      activity: ['산책하기', '독서하기', '명상하기', '친구와 대화하기'],
      quote: ['모든 순간이 새로운 시작입니다', '당신은 충분히 소중한 존재입니다', '오늘도 최선을 다한 당신을 응원합니다']
    };

    // 감정별 맞춤 추천
    const emotionSpecific = {
      sad: {
        music: ['따뜻한 어쿠스틱 음악', '위로가 되는 발라드', '희망적인 멜로디'],
        activity: ['따뜻한 차 마시기', '일기 쓰기', '좋았던 추억 되돌아보기'],
        quote: ['슬픔도 지나가는 구름과 같습니다', '눈물은 마음을 정화시킵니다', '힘든 시간이 당신을 더 강하게 만들어줄 것입니다']
      },
      anxious: {
        music: ['명상 음악', '자연 백색소음', '느린 템포의 클래식'],
        activity: ['심호흡하기', '요가하기', '할 일 목록 정리하기'],
        quote: ['지금 이 순간에 집중하세요', '당신은 이겨낼 수 있습니다', '불안은 일시적입니다']
      },
      happy: {
        music: ['즐거운 팝송', '신나는 댄스 음악', '좋아하는 아티스트'],
        activity: ['새로운 취미 시작하기', '친구들과 시간 보내기', '특별한 순간 기록하기'],
        quote: ['행복한 순간을 소중히 간직하세요', '기쁨을 나누면 두 배가 됩니다', '오늘의 미소가 내일의 희망입니다']
      }
    };

    return emotionSpecific[emotion] || baseRecommendations;
  }

  // 추천 표시
  displayRecommendations(recommendations) {
    const modalBody = document.querySelector('.ai-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="recommendations">
        <div class="recommendation-section">
          <h4>🎵 음악 추천</h4>
          <div class="recommendation-list">
            ${recommendations.music.map(item =>
              `<div class="recommendation-item">♪ ${item}</div>`
            ).join('')}
          </div>
        </div>

        <div class="recommendation-section">
          <h4>🏃‍♀️ 활동 추천</h4>
          <div class="recommendation-list">
            ${recommendations.activity.map(item =>
              `<div class="recommendation-item">• ${item}</div>`
            ).join('')}
          </div>
        </div>

        <div class="recommendation-section">
          <h4>💫 오늘의 명언</h4>
          <div class="quote-section">
            ${recommendations.quote.map(quote =>
              `<div class="quote-item">"${quote}"</div>`
            ).join('')}
          </div>
        </div>

        <div class="recommendation-actions">
          <button class="btn-apply-recommendation" onclick="this.innerHTML='✓ 적용됨'; this.disabled=true;">
            추천 적용하기
          </button>
        </div>
      </div>
    `;
  }

  // 유틸리티 메서드들
  getEmotionIcon(emotion) {
    const icons = {
      happy: '😊', sad: '😢', angry: '😠', anxious: '😰', neutral: '😐',
      excited: '🤩', peaceful: '😌', confused: '😕',
      joy: '😄', contentment: '😊', gratitude: '🙏', love: '❤️',
      grief: '😭', frustration: '😤', fear: '😨', loneliness: '😞'
    };
    return icons[emotion] || '😐';
  }

  getEmotionLabel(emotion) {
    const labels = {
      happy: '행복', sad: '슬픔', angry: '분노', anxious: '불안', neutral: '보통',
      excited: '신남', peaceful: '평온', confused: '혼란',
      joy: '기쁨', contentment: '만족', gratitude: '감사', love: '사랑',
      grief: '비탄', frustration: '좌절', fear: '두려움', loneliness: '외로움'
    };
    return labels[emotion] || '알 수 없음';
  }

  getEmotionColor(emotion) {
    const colors = {
      happy: '#74c0fc', sad: '#ff8787', angry: '#ffa94d', anxious: '#ffd43b', neutral: '#ced4da',
      excited: '#ff6b9d', peaceful: '#51cf66', confused: '#9775fa',
      joy: '#74c0fc', contentment: '#69db7c', gratitude: '#ffd43b', love: '#ff6b9d',
      grief: '#495057', frustration: '#ffa94d', fear: '#6c757d', loneliness: '#868e96'
    };
    return colors[emotion] || '#ced4da';
  }
}

// 전역 인스턴스
export const aiDashboard = new AIDashboard();