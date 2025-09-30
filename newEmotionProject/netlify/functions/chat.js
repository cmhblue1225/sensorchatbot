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
    const { message, history = [] } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '메시지가 누락되었습니다.' })
      };
    }

    // 🚨 서버 측 안전 필터 체크 (메시지 + 일기 내용)
    const safetyKeywords = [
      '죽고 싶어', '죽고싶어', '죽고시펑', '죽고시퍼', '자살', '자해', '목숨', '죽을래', '죽을거야',
      '자살할래', '자살하고싶어', '죽음', '죽자', '살기 싫어', '살기싫어', '죽어버리고',
      '죽을정도로', '죽을만큼', '더 이상 못 살겠어', '더이상 못살겠어',
      '세상이 무너져', '모든 걸 포기', '희망이 없어', '견딜 수 없어',
      '너무 힘들어서 죽', '고통스러워서 죽', '괴로워서 죽',
      '뛰어내리', '목을 매', '칼로', '약을 많이', '가스', '독',
      '살 이유가 없어', '존재 이유', '의미가 없어', '모든 게 끝', '끝내버릴게',
      '죽고십어', '죽고싶다', '죽어버려', '죽었으면', '사라지고싶어',
      '그냥 죽', '진짜 죽', '정말 죽', '죽는게 나아', '죽는게 낫겠'
    ];

    // 일기 기반 상담인지 확인
    const isDiaryBasedChat = message.includes('사용자의 일기 내용은 다음과 같습니다');
    let textToCheck = message;

    // 일기 기반 상담인 경우 일기 내용만 추출해서 검사
    if (isDiaryBasedChat) {
      const diaryMatch = message.match(/"([^"]+)"/);
      if (diaryMatch) {
        textToCheck = diaryMatch[1]; // 일기 내용만 추출
        console.log('📝 일기 기반 상담 - 일기 내용 안전 검사:', textToCheck);
      }
    }

    const messageText = textToCheck.toLowerCase().replace(/\s/g, '');
    let isDangerous = false;

    for (const keyword of safetyKeywords) {
      if (messageText.includes(keyword.toLowerCase().replace(/\s/g, ''))) {
        isDangerous = true;
        console.warn('⚠️ 위험 키워드 감지:', keyword, '입력 텍스트:', textToCheck);
        break;
      }
    }

    if (isDangerous) {
      const safetySource = isDiaryBasedChat ? '일기 내용' : '메시지';
      console.warn(`⚠️ 서버에서 위험한 ${safetySource} 감지:`, textToCheck);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reply: `🆘 **도움을 받으세요**

${isDiaryBasedChat ? '작성하신 일기를 통해' : '보내주신 메시지를 통해'} 많이 힘드신 상황임을 알 수 있습니다. 혼자 견디지 마시고 전문가의 도움을 받아보세요.

📞 **자살예방상담전화**
• **전화번호**: 109 (24시간 무료 상담)
• **언어**: 한국어, 영어
• **운영 시간**: 24시간 연중무휴

🌐 **온라인 상담**
• 생명의전화: https://www.lifeline.or.kr
• 청소년 전화: 1388

💙 **당신은 혼자가 아닙니다**
지금 이 순간이 힘들더라도, 반드시 좋아질 날이 올 것입니다. 전문 상담사와 이야기해보세요.`,
          isSafetyResponse: true
        })
      };
    }

    // 시스템 프롬프트 - 감정 상담 전문 AI
    const systemPrompt = `
당신은 전문적이고 공감적인 감정 상담 AI입니다. 사용자의 마음을 이해하고 위로하며, 건설적인 조언을 제공하세요.

🚨 **중요한 안전 가이드라인**:
- 사용자가 자살, 자해, 극단적 선택에 대해 언급하면 NEVER 일반적인 상담을 시도하지 마세요.
- 즉시 "자살예방상담전화 109번(24시간 무료 상담)"을 안내하세요.
- 생명의 소중함을 강조하고, 혼자가 아님을 알려주세요.
- 위기 상황에서는 반복적인 말보다 구체적인 도움 방법을 제시하세요.

상담 원칙:
- 친근하고 따뜻한 말투로 응답
- 사용자의 감정을 먼저 공감하고 인정
- 구체적이고 실용적인 조언 제공
- 긍정적인 관점 제시하되 현실적으로 접근
- 같은 말을 반복하지 말고 다양한 표현 사용

답변 형식:
- 일반 상담: 2-3문장으로 간결하게
- 위기 상황: 전문가 도움 안내 우선
- 절대 같은 문구를 반복하지 마세요
    `;

    // 대화 히스토리 구성
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // 최근 10개 대화만 유지
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
    });

    const reply = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    console.error('Chat error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '채팅 처리 중 오류가 발생했습니다.' })
    };
  }
};