document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const diaryId = params.get("id");
  
    // 예시 데이터
    const exampleDiary = {
      id: diaryId,
      title: "조금 울적해",
      content: "오늘은 혼자 있고 싶었어...",
      feedback: "당신의 감정은 매우 중요한 가치입니다. 너무 걱정하지 마세요.",
      music: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    };
  
    document.getElementById("title").innerText = exampleDiary.title;
    document.getElementById("content").innerText = exampleDiary.content;
    document.getElementById("feedback").innerText = exampleDiary.feedback;
    document.getElementById("music").href = exampleDiary.music;
  });
  
  function goToChat() {
    const params = new URLSearchParams(window.location.search);
    const diaryId = params.get("id");
    window.location.href = `chat.html?fromDiary=${diaryId}`;
  }
  