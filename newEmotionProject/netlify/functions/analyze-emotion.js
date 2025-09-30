const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { content } = JSON.parse(event.body);

    if (!content) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '일기 내용이 누락되었습니다.' })
      };
    }

    // 테스트용: OpenAI API 키가 없을 때 간단한 키워드 기반 분석
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      // 실제 AI 처리 시간을 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));

      // 간단한 키워드 기반 감정 분석
      const contentLower = content.toLowerCase();
      let emotion = 'neutral';

      if (contentLower.includes('행복') || contentLower.includes('기쁘') || contentLower.includes('좋') || contentLower.includes('신나') || contentLower.includes('즐거') || contentLower.includes('쌔행') || contentLower.includes('기분좋') || contentLower.includes('만족')) {
        emotion = 'happy';
      } else if (contentLower.includes('슬프') || contentLower.includes('우울') || contentLower.includes('힘들') || contentLower.includes('아프') || contentLower.includes('눈물') || contentLower.includes('상처') || contentLower.includes('괴로') || contentLower.includes('고통') || contentLower.includes('쓸쓸') || contentLower.includes('외로') || contentLower.includes('절망') || contentLower.includes('힘든 일') || contentLower.includes('너무 힘')) {
        emotion = 'sad';
      } else if (contentLower.includes('화나') || contentLower.includes('짜증') || contentLower.includes('분노') || contentLower.includes('열받') || contentLower.includes('빡쳐') || contentLower.includes('싫어') || contentLower.includes('꼴보기 싫')) {
        emotion = 'angry';
      } else if (contentLower.includes('불안') || contentLower.includes('걱정') || contentLower.includes('무서') || contentLower.includes('긴장') || contentLower.includes('조마조마') || contentLower.includes('떨려') || contentLower.includes('초조')) {
        emotion = 'anxious';
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ emotion })
      };
    }

    const prompt = `
사용자의 일기 내용을 분석하여 감정을 분류하세요.
감정은 반드시 다음 중 하나입니다: "happy", "sad", "angry", "anxious", "neutral".
다른 설명 없이 아래와 같은 JSON 형식으로만 응답하세요:

{"emotion": "happy"}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '감정 분석기입니다. 감정만 정확하게 JSON으로 응답하세요.' },
        { role: 'user', content: `${prompt}\n\n${content}` }
      ]
    });

    let emotion = '';
    const raw = completion.choices[0].message.content.trim();

    try {
      const parsed = JSON.parse(raw);
      emotion = parsed.emotion?.toLowerCase().trim();
    } catch (e) {
      console.error('JSON 파싱 실패:', raw);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GPT 응답 파싱 실패', raw })
      };
    }

    if (!['happy', 'sad', 'angry', 'anxious', 'neutral'].includes(emotion)) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '감정 분석 실패', emotion })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ emotion })
    };
  } catch (error) {
    console.error('GPT 분석 오류:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '감정 분석 중 오류 발생', detail: error.message })
    };
  }
};