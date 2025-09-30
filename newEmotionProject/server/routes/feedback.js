import OpenAI from 'openai';
import express from 'express';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/', async (req, res) => {
  const { diaryContent, selectedEmotion } = req.body;

  if (!diaryContent || !selectedEmotion) {
    return res.status(400).json({ error: '일기 내용 또는 감정이 부족합니다.' });
  }

  try {
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
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const feedbackText = completion.choices[0].message.content;

    res.json({ feedback: feedbackText });
  } catch (error) {
    console.error('GPT feedback error:', error);
    res.status(500).json({ error: '피드백 생성 실패' });
  }
});

export default router;