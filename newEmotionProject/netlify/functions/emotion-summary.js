import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://vzmvgyxsscfyflgxcpnq.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6bXZneXhzc2NmeWZsZ3hjcG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDI4NzgsImV4cCI6MjA1OTk3ODg3OH0.-hQSBKVvPUX_KpbOp0zT25xMEjmky3WR-STC06kP0n4'
);

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // GET과 POST 요청 허용
  if (!['GET', 'POST'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // POST 요청: GPT 기반 감정 주간 분석
    if (event.httpMethod === 'POST') {
      const { emotions } = JSON.parse(event.body || '{}');

      if (!emotions || !Array.isArray(emotions)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '감정 데이터가 필요합니다.' })
        };
      }

      // 간단한 감정 패턴 분석 (OpenAI 없이)
      const validEmotions = emotions.filter(e => e.score !== null);
      if (validEmotions.length === 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            summary: '아직 충분한 감정 데이터가 없습니다. 더 많은 일기를 작성해보세요!'
          })
        };
      }

      const avgScore = validEmotions.reduce((sum, e) => sum + parseFloat(e.score), 0) / validEmotions.length;
      const trend = avgScore > 0.5 ? '긍정적' : avgScore < -0.5 ? '부정적' : '안정적';

      let summary = `이번 주 감정 패턴은 전반적으로 ${trend}인 경향을 보입니다. `;

      if (avgScore > 0.5) {
        summary += '행복하고 긍정적인 감정이 많았네요! 이런 좋은 에너지를 계속 유지하시길 바라요. ';
      } else if (avgScore < -0.5) {
        summary += '힘든 시간을 보내고 계시는군요. 충분한 휴식과 자기 돌봄이 필요할 것 같아요. ';
      } else {
        summary += '비교적 균형잡힌 감정 상태를 유지하고 계시네요. ';
      }

      summary += `총 ${validEmotions.length}일의 기록을 분석했습니다.`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ summary })
      };
    }

    // GET 요청: 기존 사용자 감정 통계 로직
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '인증이 필요합니다.' })
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: '유효하지 않은 토큰입니다.' })
      };
    }

    // 사용자의 감정 통계 조회
    const { data: emotions, error } = await supabase
      .from('diaries')
      .select('emotion, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '데이터 조회 실패', detail: error.message })
      };
    }

    // 감정별 통계 계산
    const emotionCounts = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      neutral: 0
    };

    const recentEmotions = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    emotions.forEach(entry => {
      emotionCounts[entry.emotion]++;

      const entryDate = new Date(entry.created_at);
      if (entryDate >= sevenDaysAgo) {
        recentEmotions.push({
          emotion: entry.emotion,
          date: entry.created_at
        });
      }
    });

    const totalEntries = emotions.length;
    const emotionPercentages = {};

    Object.keys(emotionCounts).forEach(emotion => {
      emotionPercentages[emotion] = totalEntries > 0
        ? Math.round((emotionCounts[emotion] / totalEntries) * 100)
        : 0;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalEntries,
        emotionCounts,
        emotionPercentages,
        recentEmotions: recentEmotions.slice(0, 10) // 최근 10개
      })
    };
  } catch (error) {
    console.error('Emotion summary error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '감정 요약 처리 중 오류가 발생했습니다.' })
    };
  }
};