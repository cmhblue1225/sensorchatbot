const chatBox = document.getElementById("chat-box");
const input = document.getElementById("chat-input");
const form = document.getElementById("chat-form");
const typingIndicator = document.getElementById("typing");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = input.value;
  if (!message) return;

  appendMessage("나", message);
  input.value = "";
  typingIndicator.style.display = "block";

  try {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();

    appendMessage("감정 GPT", data.reply);
  } catch (err) {
    appendMessage("감정 GPT", "오류가 발생했습니다.");
  } finally {
    typingIndicator.style.display = "none";
  }
});

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = "chat-message";
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}
