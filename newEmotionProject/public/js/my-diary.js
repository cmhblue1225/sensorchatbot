import { supabase } from './supabase.js';
import { checkAuth } from './auth.js';

checkAuth();

const diaryList = document.getElementById('diary-list');
const emotionFilter = document.getElementById('emotion-filter');
const logoutBtn = document.getElementById('logout-btn');

const emotionMap = {
  happy: '행복',
  sad: '슬픔',
  angry: '분노',
  anxious: '불안',
  neutral: '중립'
};

const colorClassMap = {
  happy: 'color-happy',
  sad: 'color-sad',
  angry: 'color-angry',
  anxious: 'color-anxious',
  neutral: 'color-neutral'
};

let diaries = [];

async function fetchDiaries() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }); // ✅ 최신순 정렬

  if (error) {
    alert('일기 불러오기 실패: ' + error.message);
    return;
  }

  diaries = data;
  renderDiaries();
}

function renderDiaries() {
  const selected = emotionFilter.value;

  const filtered = selected === 'all'
    ? diaries
    : diaries.filter((d) => d.emotion === selected);

  diaryList.innerHTML = '';

  if (filtered.length === 0) {
    diaryList.innerHTML = '<p>일기가 없습니다.</p>';
    return;
  }

  filtered.forEach((diary) => {
    const card = document.createElement('div');
    card.className = `diary-card ${colorClassMap[diary.emotion] || ''}`;

    const emotionText = emotionMap[diary.emotion] || diary.emotion;
    const date = new Date(diary.created_at).toLocaleDateString();

    card.innerHTML = `
      <button class="delete-btn" data-id="${diary.id}">삭제</button>
      <h3>${emotionText} 일기</h3>
      <div class="date">${date}</div>
      <p>${diary.content}</p>
      <button onclick="location.href='diary-detail.html?id=${diary.id}'">상세보기</button>
    `;

    diaryList.appendChild(card);
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      if (confirm('정말 삭제하시겠습니까?')) {
        const { error } = await supabase
          .from('diaries')
          .delete()
          .eq('id', id);

        if (error) {
          alert('삭제 실패: ' + error.message);
        } else {
          diaries = diaries.filter((d) => d.id !== id);
          renderDiaries();
        }
      }
    });
  });
}

emotionFilter.addEventListener('change', renderDiaries);

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  location.href = 'login.html';
});

fetchDiaries();
