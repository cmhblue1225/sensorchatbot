import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { emotions } = req.body; // [{ date, score }]

  if (!emotions || !Array.isArray(emotions)) {
    return res.status(400).json({ error: '감정 데이터가 누락되었습니다.' });
  }

  const summaryText = emotions.map(e => `${e.date}: 감정 점수 ${e.score}`).join('\n');

  const prompt = `
다음은 사용자의 최근 감정 흐름입니다:

${summaryText}

감정 상담사로써 사용자에게 위로와 용기, 즐거움을 줘야 합니다. 이 감정 흐름을 분석해서 2~3문장으로 부드럽게 피드백을 해주세요.
예: 감정이 기복이 심하다면 위로하거나 조언해주세요.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '감정 심리 상담사입니다.' },
        { role: 'user', content: prompt }
      ]
    });

    const reply = completion.choices[0].message.content.trim();
    res.json({ summary: reply });
  } catch (err) {
    console.error('GPT 피드백 오류:', err.message);
    res.status(500).json({ error: 'GPT 처리 실패', detail: err.message });
  }
});

export default router;
