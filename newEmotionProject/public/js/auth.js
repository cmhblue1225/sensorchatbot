import { supabase } from './supabase.js';

export async function checkAuth() {
  const { data, error } = await supabase.auth.getSession();

  if (!data.session) {
    alert('로그인이 필요합니다.');
    location.href = 'login.html';
  }
}
