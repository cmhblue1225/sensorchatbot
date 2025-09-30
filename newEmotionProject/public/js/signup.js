import { supabase } from './supabase.js';

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert('회원가입 실패: ' + error.message);
    return;
  }

  alert('회원가입 성공! 입력하신 이메일에서 인증을 완료한 후 로그인해주세요.');
  location.href = 'login.html';
});
