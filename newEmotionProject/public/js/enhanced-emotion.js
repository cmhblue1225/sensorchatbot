// 향상된 감정 분석 기능 (AI 통합 버전)
import { offlineStorage } from './offline-storage.js';

export class EnhancedEmotion {
  constructor() {
    // 24가지 확장된 감정 타입
    this.emotions = {
      // 긍정 감정
      joy: {
        label: '😄 기쁨',
        color: '#74c0fc',
        category: 'positive',
        intensity: ['기쁨', '만족', '환희', '행복'],
        keywords: ['기쁘', '행복', '좋', '웃', '즐거', '신나', '만족', '뿌듯']
      },
      contentment: {
        label: '😊 만족',
        color: '#69db7c',
        category: 'positive',
        intensity: ['평안', '만족', '충족', '행복'],
        keywords: ['만족', '충분', '괜찮', '좋', '편안', '알맞']
      },
      gratitude: {
        label: '🙏 감사',
        color: '#ffd43b',
        category: 'positive',
        intensity: ['고마움', '감사', '감동', '깊은 감사'],
        keywords: ['감사', '고마', '고맙', '감동', '은혜', '축복']
      },
      love: {
        label: '❤️ 사랑',
        color: '#ff6b9d',
        category: 'positive',
        intensity: ['애정', '좋아함', '사랑', '깊은 사랑'],
        keywords: ['사랑', '좋아', '애정', '마음', '소중', '아끼']
      },
      excitement: {
        label: '🤩 흥분/설렘',
        color: '#ff8cc8',
        category: 'positive',
        intensity: ['관심', '흥미', '설렘', '흥분'],
        keywords: ['신나', '흥미', '재미', '멋지', '와우', '대박', '최고', '설레']
      },
      pride: {
        label: '😤 자부심',
        color: '#fd7e14',
        category: 'positive',
        intensity: ['뿌듯함', '자랑스러움', '자부심', '큰 자부심'],
        keywords: ['뿌듯', '자랑', '성취', '해냈', '잘했', '대단']
      },
      hope: {
        label: '🌟 희망',
        color: '#fcc419',
        category: 'positive',
        intensity: ['기대', '바람', '희망', '강한 희망'],
        keywords: ['희망', '기대', '바라', '꿈꾸', '기원', '소망']
      },
      relief: {
        label: '😌 안도',
        color: '#51cf66',
        category: 'positive',
        intensity: ['가벼움', '안도', '편안함', '큰 안도'],
        keywords: ['안도', '다행', '편안', '후련', '가벼워', '해결']
      },

      // 부정 감정
      sadness: {
        label: '😢 슬픔',
        color: '#74c0fc',
        category: 'negative',
        intensity: ['아쉬움', '실망', '슬픔', '깊은 슬픔'],
        keywords: ['슬프', '우울', '아쉽', '실망', '허탈', '외로', '눈물']
      },
      grief: {
        label: '😭 비탄',
        color: '#495057',
        category: 'negative',
        intensity: ['상실감', '아픔', '비탄', '깊은 비탄'],
        keywords: ['이별', '잃었', '비탄', '절망', '상실', '그리움']
      },
      anger: {
        label: '😠 분노',
        color: '#ff8787',
        category: 'negative',
        intensity: ['짜증', '화남', '분노', '격노'],
        keywords: ['화나', '짜증', '분노', '열받', '빡치', '성질', '억울']
      },
      frustration: {
        label: '😤 좌절',
        color: '#ffa94d',
        category: 'negative',
        intensity: ['막힘', '답답함', '좌절', '깊은 좌절'],
        keywords: ['답답', '막막', '좌절', '안되', '힘들', '어렵']
      },
      anxiety: {
        label: '😰 불안',
        color: '#ffd43b',
        category: 'negative',
        intensity: ['걱정', '불안', '초조', '극도의 불안'],
        keywords: ['불안', '걱정', '무서', '두려', '초조', '긴장', '스트레스']
      },
      fear: {
        label: '😨 두려움',
        color: '#6c757d',
        category: 'negative',
        intensity: ['불안', '두려움', '공포', '극도의 공포'],
        keywords: ['무서', '두려', '공포', '겁나', '떨려', '무서워']
      },
      guilt: {
        label: '😔 죄책감',
        color: '#9775fa',
        category: 'negative',
        intensity: ['미안함', '죄책감', '자책', '깊은 죄책감'],
        keywords: ['미안', '죄책', '자책', '잘못', '후회', '죄송']
      },
      shame: {
        label: '😳 수치심',
        color: '#e03131',
        category: 'negative',
        intensity: ['부끄러움', '수치심', '창피함', '깊은 수치심'],
        keywords: ['부끄', '창피', '수치', '어색', '민망', '쪽팔려']
      },
      loneliness: {
        label: '😞 외로움',
        color: '#868e96',
        category: 'negative',
        intensity: ['쓸쓸함', '외로움', '고독', '깊은 고독'],
        keywords: ['외로', '혼자', '쓸쓸', '고독', '적막', '홀로']
      },
      disappointment: {
        label: '😕 실망',
        color: '#adb5bd',
        category: 'negative',
        intensity: ['아쉬움', '실망', '좌절', '깊은 실망'],
        keywords: ['실망', '아쉬', '기대', '헛된', '허무', '안타까']
      },

      // 중성 감정
      calm: {
        label: '😌 평온',
        color: '#51cf66',
        category: 'neutral',
        intensity: ['차분', '평온', '안정', '깊은 평온'],
        keywords: ['차분', '평온', '고요', '조용', '편안', '안정', '여유']
      },
      contemplative: {
        label: '🤔 사색적',
        color: '#9775fa',
        category: 'neutral',
        intensity: ['생각', '사색', '깊은 생각', '철학적'],
        keywords: ['생각', '사색', '고민', '철학', '의미', '깊이']
      },
      curious: {
        label: '🤨 호기심',
        color: '#ff922b',
        category: 'neutral',
        intensity: ['관심', '호기심', '강한 호기심', '탐구욕'],
        keywords: ['궁금', '호기심', '관심', '알고싶', '탐구', '신기']
      },
      nostalgic: {
        label: '😌 그리움',
        color: '#da77f2',
        category: 'neutral',
        intensity: ['추억', '그리움', '향수', '깊은 그리움'],
        keywords: ['그립', '추억', '옛날', '과거', '향수', '그때']
      },
      confused: {
        label: '😕 혼란',
        color: '#9775fa',
        category: 'neutral',
        intensity: ['의문', '혼란', '갈등', '깊은 혼란'],
        keywords: ['헷갈', '혼란', '복잡', '모르겠', '갈등', '애매', '의문']
      },
      indifferent: {
        label: '😐 무관심',
        color: '#ced4da',
        category: 'neutral',
        intensity: ['평범', '무관심', '냉담', '완전무관심'],
        keywords: ['평범', '보통', '그냥', '무난', '상관없', '별로']
      }
    };
  }

  // 확장된 감정 분석 (키워드 기반 + AI)
  async analyzeEmotion(content, useAI = true) {
    // 1. 오프라인 캐시 확인
    const cachedEmotion = await offlineStorage.getCachedEmotion(content);
    if (cachedEmotion) {
      return {
        emotion: cachedEmotion,
        confidence: 0.8,
        method: 'cache',
        intensity: this.getEmotionIntensity(content, cachedEmotion)
      };
    }

    // 2. 키워드 기반 분석
    const keywordResult = this.analyzeByKeywords(content);

    // 3. AI 분석 (온라인 상태에서만)
    if (useAI && navigator.onLine) {
      try {
        const aiResult = await this.analyzeByAI(content);

        // AI 결과와 키워드 결과 결합
        const finalEmotion = this.combineResults(keywordResult, aiResult);

        // 결과 캐시
        await offlineStorage.cacheEmotionAnalysis(content, finalEmotion.emotion);

        return finalEmotion;
      } catch (error) {
        console.log('AI 분석 실패, 키워드 분석 사용:', error);
        return keywordResult;
      }
    }

    return keywordResult;
  }

  // 키워드 기반 감정 분석
  analyzeByKeywords(content) {
    const text = content.toLowerCase();
    const scores = {};

    // 각 감정별 키워드 매칭
    Object.entries(this.emotions).forEach(([emotion, data]) => {
      scores[emotion] = 0;
      data.keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'g');
        const matches = text.match(regex);
        if (matches) {
          scores[emotion] += matches.length;
        }
      });
    });

    // 최고 점수 감정 선택
    const maxEmotion = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );

    return {
      emotion: maxEmotion || 'neutral',
      confidence: Math.min(scores[maxEmotion] / 3, 1),
      method: 'keywords',
      intensity: this.getEmotionIntensity(content, maxEmotion),
      breakdown: scores
    };
  }

  // 고급 AI 감정 분석 (GPT-4o 기반)
  async analyzeByAI(content, diaryId = null) {
    try {
      const { supabase } = await import('./supabase.js');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch('/.netlify/functions/advanced-emotion-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          diaryId,
          analysisType: 'comprehensive'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        emotions: data.emotions || [{ type: 'neutral', intensity: 50, confidence: 0.5 }],
        overall_mood_score: data.overall_mood_score || 0,
        keywords: data.keywords || [],
        ai_insights: data.ai_insights || '',
        personalized_advice: data.personalized_advice || '',
        complexity_score: data.complexity_score || 0.5,
        similar_entries: data.similar_entries || [],
        method: 'advanced_ai',
        cached: data.cached || false,
        processing_time: data.processing_time || 0
      };
    } catch (error) {
      console.error('고급 AI 분석 실패:', error);
      // 기본 AI 분석으로 폴백
      return await this.fallbackAIAnalysis(content);
    }
  }

  // 기본 AI 분석 (폴백용)
  async fallbackAIAnalysis(content) {
    try {
      const response = await fetch('/.netlify/functions/analyze-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      return {
        emotions: [{ type: data.emotion, intensity: 70, confidence: 0.8 }],
        overall_mood_score: this.emotionToMoodScore(data.emotion),
        keywords: [],
        ai_insights: '기본 감정 분석 완료',
        method: 'basic_ai',
        cached: false
      };
    } catch (error) {
      console.error('기본 AI 분석도 실패:', error);
      return null;
    }
  }

  // 감정을 기분 점수로 변환
  emotionToMoodScore(emotion) {
    const moodMap = {
      joy: 80, contentment: 60, gratitude: 70, love: 85, excitement: 75,
      pride: 65, hope: 55, relief: 50,
      sadness: -60, grief: -80, anger: -70, frustration: -55, anxiety: -65,
      fear: -75, guilt: -45, shame: -50, loneliness: -60, disappointment: -40,
      calm: 20, contemplative: 10, curious: 30, nostalgic: 0, confused: -10, indifferent: 0
    };
    return moodMap[emotion] || 0;
  }

  // 결과 결합 (AI 우선, 키워드 보조)
  combineResults(keywordResult, aiResult) {
    // AI 결과를 우선하되, 키워드 결과로 보정
    const confidence = keywordResult.confidence > 0.5 &&
                     keywordResult.emotion === aiResult.emotion ?
                     Math.min(aiResult.confidence + 0.1, 1.0) :
                     aiResult.confidence;

    return {
      emotion: aiResult.emotion,
      confidence,
      method: 'combined',
      intensity: aiResult.intensity,
      breakdown: keywordResult.breakdown
    };
  }

  // 감정 강도 계산
  getEmotionIntensity(content, emotion) {
    const text = content.toLowerCase();
    const length = content.length;

    // 강조 표현 감지
    const emphasisCount = (text.match(/[!]{2,}|[?]{2,}|[.]{3,}/g) || []).length;
    const capsCount = (content.match(/[A-Z]{2,}/g) || []).length;

    // 기본 강도 (0-3)
    let intensity = 1;

    // 텍스트 길이에 따른 강도 조정
    if (length > 500) intensity += 1;
    if (length > 1000) intensity += 1;

    // 강조 표현에 따른 강도 조정
    if (emphasisCount > 0) intensity += Math.min(emphasisCount, 2);
    if (capsCount > 0) intensity += 1;

    return Math.min(Math.max(intensity, 0), 3);
  }

  // 감정 설명 생성
  getEmotionDescription(emotion, intensity) {
    const emotionData = this.emotions[emotion];
    if (!emotionData) return '알 수 없는 감정';

    const intensityLabel = emotionData.intensity[intensity] || emotionData.intensity[1];
    return `${emotionData.label} (${intensityLabel})`;
  }

  // 감정별 추천 활동
  getRecommendedActivities(emotion, intensity) {
    const activities = {
      happy: [
        '좋은 순간을 사진으로 남겨보세요',
        '감사 일기를 써보세요',
        '친구나 가족과 이 기쁨을 나누어보세요',
        '새로운 취미에 도전해보세요'
      ],
      sad: [
        '따뜻한 차 한 잔을 마시며 휴식을 취하세요',
        '좋아하는 영화나 책을 즐겨보세요',
        '산책이나 가벼운 운동을 해보세요',
        '신뢰하는 사람과 대화해보세요'
      ],
      angry: [
        '깊게 숨을 들이쉬고 내쉬어보세요',
        '운동으로 에너지를 발산해보세요',
        '문제 해결책을 차근차근 생각해보세요',
        '잠시 시간을 두고 마음을 가라앉혀보세요'
      ],
      anxious: [
        '명상이나 요가를 시도해보세요',
        '할 일을 작은 단위로 나누어 정리해보세요',
        '자연 속에서 시간을 보내보세요',
        '전문가의 도움을 받는 것도 좋습니다'
      ],
      neutral: [
        '새로운 것을 배우거나 시도해보세요',
        '미래 계획을 세워보세요',
        '평소 미뤄왔던 일을 정리해보세요',
        '자기 성찰의 시간을 가져보세요'
      ]
    };

    return activities[emotion] || activities.neutral;
  }

  // 감정 통계 계산
  calculateEmotionStats(diaryEntries) {
    const stats = {
      total: diaryEntries.length,
      emotions: {},
      trends: {},
      averageIntensity: 0
    };

    // 감정별 카운트
    Object.keys(this.emotions).forEach(emotion => {
      stats.emotions[emotion] = 0;
    });

    diaryEntries.forEach(entry => {
      if (stats.emotions[entry.emotion] !== undefined) {
        stats.emotions[entry.emotion]++;
      }
    });

    // 최근 7일 트렌드
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentEntries = diaryEntries.filter(entry =>
      new Date(entry.created_at) >= weekAgo
    );

    stats.trends.recent = recentEntries.length;
    stats.trends.improvement = this.calculateImprovementTrend(recentEntries);

    return stats;
  }

  // 개선 트렌드 계산
  calculateImprovementTrend(entries) {
    if (entries.length < 2) return 0;

    const emotionScores = {
      happy: 2, excited: 2, peaceful: 1,
      neutral: 0,
      confused: -0.5, anxious: -1, sad: -1, angry: -2
    };

    const scores = entries.map(entry => emotionScores[entry.emotion] || 0);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }
}