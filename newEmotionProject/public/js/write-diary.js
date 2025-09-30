import { supabase } from './supabase.js';
import { checkAuth } from './auth.js';

checkAuth();

const diaryForm = document.getElementById('diary-form');
const analyzeBtn = document.getElementById('analyze-btn');
const emotionSelect = document.getElementById('emotion');

analyzeBtn.addEventListener('click', async () => {
  const content = document.getElementById('content').value.trim();
  if (!content) return alert('일기 내용을 먼저 입력해주세요.');

  const res = await fetch('/.netlify/functions/analyze-emotion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });

  const data = await res.json();
  if (data.emotion) {
    emotionSelect.value = data.emotion;
  } else {
    alert('감정 분석 실패');
  }
});

diaryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('content').value.trim();
  const emotion = emotionSelect.value;

  if (!content || !emotion) return alert('내용과 감정을 모두 입력해주세요.');

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('diaries').insert({
    user_id: user.id,
    content,
    emotion
  });

  if (error) {
    alert('일기 저장 실패: ' + error.message);
    return;
  }

  alert('일기가 저장되었습니다.');
  location.href = 'my-diary.html';
});
