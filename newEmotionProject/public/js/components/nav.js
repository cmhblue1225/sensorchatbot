// client/js/components/nav.js

export function insertBottomNav() {
    const navHTML = `
      <nav class="bottom-nav">
        <a href="dashboard.html">🏠</a>
        <a href="my-diary.html">📘</a>
        <a href="community.html">🌍</a>
        <a href="stats.html">📊</a>
        <a href="my-page.html">🙋</a>
      </nav>
    `;
  
    document.body.insertAdjacentHTML('beforeend', navHTML);
  
    // 현재 페이지 강조
    const currentPage = location.pathname.split('/').pop();
    document.querySelectorAll('.bottom-nav a').forEach(link => {
      const linkPage = link.getAttribute('href');
      if (currentPage === linkPage) {
        link.classList.add('active');
      }
    });
  }
  