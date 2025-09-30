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
다음은 사용자의 일기 내용입니다.

"${content}"

이 일기를 바탕으로 다음을 응답하세요:
1. 감정을 happy, sad, angry, anxious, neutral 중 하나로 분석합니다.
2. 간단한 위로의 말 (1~2문장)
3. 관련된 YouTube 음악 추천 (링크 포함)

응답은 JSON 형식으로 아래처럼 해주세요:

{
  "emotion": "",
  "feedback": "",
  "music": "https://..."
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '일기를 분석하고 응원과 음악을 추천하는 따뜻하게 말하는 상담사AI입니다.' },
        { role: 'user', content: prompt }
      ]
    });

    const raw = completion.choices[0].message.content.trim();

    // GPT 응답이 JSON이 아니면 파싱 에러 방지
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({ error: 'GPT 응답 파싱 실패', raw });
    }

    res.json(parsed);
  } catch (err) {
    console.error('GPT 처리 실패:', err.message);
    res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

export default router;
