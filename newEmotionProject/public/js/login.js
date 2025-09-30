import { supabase } from './supabase.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert('로그인 실패: ' + error.message);
    return;
  }

  // 로그인 성공 → 토큰 저장 + 페이지 이동
  localStorage.setItem('supabase_token', data.session.access_token);
  location.href = 'dashboard.html';
});
