import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: '일기 내용이 누락되었습니다.' });
  }

  try {
    const prompt = `
사용자의 일기 내용을 분석하여 감정을 분류하세요.
감정은 반드시 다음 중 하나입니다: "happy", "sad", "angry", "anxious", "neutral".
다른 설명 없이 아래와 같은 JSON 형식으로만 응답하세요:

{"emotion": "happy"}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
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
      return res.status(500).json({ error: 'GPT 응답 파싱 실패', raw });
    }

    if (!['happy', 'sad', 'angry', 'anxious', 'neutral'].includes(emotion)) {
      return res.status(500).json({ error: '감정 분석 실패', emotion });
    }

    res.json({ emotion });
  } catch (error) {
    console.error('GPT 분석 오류:', error.message);
    res.status(500).json({ error: '감정 분석 중 오류 발생', detail: error.message });
  }
});

export default router;
