document.addEventListener("DOMContentLoaded", () => {
    const list = document.getElementById("community-list");
  
    const communityPosts = [
      {
        id: 101,
        emotion: "😢",
        title: "오늘 울었어요",
        content: "왜 그랬는지는 모르겠지만 너무 힘들었어요...",
        likes: 4
      },
      {
        id: 102,
        emotion: "😊",
        title: "작은 기쁨",
        content: "편의점에서 알바하면서 아이가 인사해줬어요.",
        likes: 10
      }
    ];
  
    communityPosts.forEach(post => {
      const div = document.createElement("div");
      div.className = "community-post";
      div.innerHTML = `
        <p>${post.emotion}</p>
        <h4>${post.title}</h4>
        <p>${post.content}</p>
        <button>좋아요 ❤️ (${post.likes})</button>
      `;
      list.appendChild(div);
    });
  });
  