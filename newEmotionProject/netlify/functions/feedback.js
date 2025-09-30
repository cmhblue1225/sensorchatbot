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
    const { diaryContent, selectedEmotion } = JSON.parse(event.body);

    if (!diaryContent || !selectedEmotion) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '일기 내용 또는 감정이 부족합니다.' })
      };
    }

    // 테스트용: OpenAI API 키가 없을 때 더미 응답
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      // 실제 AI 처리 시간을 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      const emotionFeedbacks = {
        happy: {
          feedback: `오늘 하루 정말 기쁜 일이 있으셨군요! 당신의 일기에서 느껴지는 긍정적인 에너지가 정말 아름답습니다. 이런 행복한 순간들이 인생의 가장 소중한 보물이 되곤 하죠. 이 기쁨을 마음 깊이 간직하시고, 주변 사람들과도 나누어 보세요. 행복은 나눌수록 배가 되는 마법 같은 감정이니까요. 오늘의 이 특별한 순간을 기억하며, 앞으로도 더 많은 행복한 일들이 찾아오길 바랍니다.`,
          song: "Happy",
          artist: "Pharrell Williams",
          reason: "밝고 경쾌한 멜로디가 당신의 기쁜 마음과 완벽하게 어울립니다. 이 곡을 들으면 자연스럽게 미소가 지어지고, 온몸이 리듬에 맞춰 움직이고 싶어질 거예요.",
          youtube: "https://www.youtube.com/watch?v=ZbZSe6N_BXs"
        },
        sad: {
          feedback: `힘든 시간을 보내고 계시는군요. 슬픔이라는 감정도 우리 인생에서 없어서는 안 될 소중한 부분입니다. 지금 느끼시는 아픔을 부정하지 마시고, 충분히 느껴보세요. 눈물이 나온다면 참지 마시고 흘려보세요. 슬픔 뒤에는 반드시 치유와 성장이 따라옵니다. 시간이 모든 상처를 아물게 해줄 것이고, 지금의 경험이 당신을 더욱 단단하고 지혜로운 사람으로 만들어 줄 거예요. 혼자가 아니라는 것을 기억해 주세요.`,
          song: "사랑했나봐",
          artist: "윤도현",
          reason: "따뜻한 위로가 되는 곡으로, 슬픈 마음을 달래는 데 도움이 될 것입니다. 가사 하나하나가 마음에 깊이 와닿으며, 외로움을 달래주는 친구 같은 노래입니다.",
          youtube: "https://www.youtube.com/watch?v=cjJ89EGdFts"
        },
        angry: {
          feedback: `화가 나는 일이 있으셨군요. 분노는 우리가 뭔가 잘못되었다고 느낄 때 나타나는 자연스러운 감정입니다. 이 감정을 억누르려 하지 마시고, 건설적인 방법으로 표현해 보세요. 운동을 하거나, 일기를 쓰거나, 신뢰할 수 있는 사람과 대화를 나누는 것도 좋습니다. 분노 뒤에 숨어있는 진짜 감정이 무엇인지 찾아보세요. 때로는 상처받은 마음이나 좌절감이 분노로 나타나기도 합니다. 깊게 숨을 쉬고, 마음을 차분히 가라앉혀 보세요.`,
          song: "Let It Go",
          artist: "Frozen OST",
          reason: "감정을 해방시키고 마음을 정화하는 데 도움이 되는 곡입니다. 억눌린 감정을 놓아주고, 새로운 시작을 위한 용기를 줄 거예요.",
          youtube: "https://www.youtube.com/watch?v=L0MK7qz13bU"
        },
        anxious: {
          feedback: `불안한 마음이 드시는군요. 불안은 미래에 대한 걱정에서 오는 경우가 많습니다. 지금 이 순간에 집중해 보세요. 깊고 느린 호흡을 통해 몸과 마음을 진정시켜 보세요. 4초간 숨을 들이마시고, 4초간 참았다가, 6초간 천천히 내쉬는 호흡법을 시도해 보세요. 불안한 생각들은 대부분 실제로 일어나지 않습니다. 현재 안전한 공간에 있다는 것을 상기시켜 주세요. 모든 것이 괜찮아질 거예요. 당신은 충분히 강하고 지혜로운 사람입니다.`,
          song: "Weightless",
          artist: "Marconi Union",
          reason: "과학적으로 불안감을 65%까지 줄이는 것으로 입증된 특별한 곡입니다. 마음을 진정시키는 주파수와 리듬으로 구성되어 있어, 명상이나 휴식 시간에 들으면 매우 효과적입니다.",
          youtube: "https://www.youtube.com/watch?v=UfcAVejslrU"
        },
        neutral: {
          feedback: `평온한 하루를 보내셨네요. 이런 안정적이고 고요한 감정도 정말 소중합니다. 때로는 특별한 일이 없는 평범한 일상이 가장 큰 축복이기도 하죠. 마음의 평정을 유지한다는 것은 쉽지 않은 일인데, 그런 면에서 당신은 정말 대단합니다. 이런 차분한 시간을 통해 내면을 들여다보고, 자신을 돌아볼 수 있는 여유를 가져보세요. 평온한 마음은 새로운 영감과 에너지의 원천이 될 수 있습니다. 현재 이 순간을 만끽하시길 바랍니다.`,
          song: "Breathe Me",
          artist: "Sia",
          reason: "차분하고 내성적인 분위기로 평온한 마음을 유지하는 데 도움이 됩니다. 섬세한 멜로디와 Sia의 감성적인 목소리가 마음을 편안하게 해줄 거예요.",
          youtube: "https://www.youtube.com/watch?v=hSjIz8oQuko"
        }
      };

      const feedback = emotionFeedbacks[selectedEmotion] || emotionFeedbacks.neutral;

      const response = `✨ 감성 피드백: ${feedback.feedback}

🎵 추천곡 제목: ${feedback.song}
🎤 가수: ${feedback.artist}
📝 추천 이유: ${feedback.reason}
▶️ 유튜브 링크: ${feedback.youtube}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ feedback: response })
      };
    }

    const prompt = `
일기 내용: ${diaryContent}

감정: ${selectedEmotion}

위의 일기 내용과 감정에 기반해서:
- 간결한 감성 피드백을 작성해줘.
- 감정에 어울리는 최신 인기곡 하나를 추천해줘.
- 추천곡 제목, 가수 이름, 추천 이유, 유튜브 링크를 각각 명확히 구분해서 알려줘.

항상 아래와 같은 형식으로 답변해:

---
✨ 감성 피드백: (텍스트)

🎵 추천곡 제목: (텍스트)
🎤 가수: (텍스트)
📝 추천 이유: (텍스트)
▶️ 유튜브 링크: (텍스트)
---
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const feedbackText = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ feedback: feedbackText })
    };
  } catch (error) {
    console.error('GPT feedback error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: '피드백 생성 실패' })
    };
  }
};