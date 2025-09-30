import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE // Render 환경 변수에서 설정
);

router.post('/', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id가 필요합니다.' });
  }

  try {
    // 1. Supabase Auth 유저 삭제
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteError) {
      console.error('Auth 삭제 실패:', deleteError);
      return res.status(500).json({ error: 'Auth 유저 삭제 실패' });
    }

    return res.json({ success: true, message: '유저 삭제 완료' });
  } catch (err) {
    console.error('삭제 중 서버 오류:', err.message);
    return res.status(500).json({ error: '서버 오류', detail: err.message });
  }
});

export default router;
