import { Discovery } from "aws-sdk";

const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const addComment = (text, name, createdAt, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.className = "video__comment";

  const commentContainer = document.createElement("div");
  commentContainer.className = "video__comment-container";
  newComment.appendChild(commentContainer);

  const commentAvatar = document.createElement("div");
  commentAvatar.className = "video__comment-avatar";
  commentContainer.appendChild(commentAvatar);

  const commentData = document.createElement("div");
  commentData.className = "video__comment-data";
  commentContainer.appendChild(commentData);

  const commentHeader = document.createElement("div");
  commentHeader.className = "video__comment-header";
  commentData.appendChild(commentHeader);

  const avatarName = document.createElement("span");
  avatarName.innerText = name;
  commentHeader.appendChild(avatarName);

  const commentCreated = document.createElement("span");
  const commentDate = new Date(createdAt);
  commentCreated.innerText = `${commentDate.getFullYear()}. ${commentDate.getMonth()}. ${commentDate.getDate()}`;
  commentHeader.appendChild(commentCreated);

  const commentText = document.createElement("div");
  commentText.className = "video__comment-text";
  commentData.appendChild(commentText);

  const loginAvatar = document.querySelector(".header__avatar");
  const img = document.createElement("img");
  img.src = loginAvatar.src;
  commentAvatar.appendChild(img);

  const p = document.createElement("p");
  p.innerText = text;
  commentText.appendChild(p);

  const commentDelete = document.createElement("div");
  commentDelete.className = "video__comment-delete";
  const a = document.createElement("a");
  a.className = "delete-btn";
  a.href = `/api/comments/${id}/delete`;
  a.innerText = "삭제";
  commentDelete.appendChild(a);
  commentData.appendChild(commentDelete);

  videoComments.prepend(newComment);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return; //text 비어 있으면 이하 코드가 작동하지 않음
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, //headers는 request의 정보를 담고 있음, express에게 JS 오브젝트 데이터를 보내고 있음을 알려 줌
    body: JSON.stringify({ text }), //textarea.value, 백엔드가 string을 받아 JS 오브젝트로 변환, req.body로 해당 데이터를 보내도록 server.js에 미들웨어 추가(app.use(express.json()))
  });
  textarea.value = ""; //데이터를 보낸 후 비워줌
  if (response.status === 201) {
    const newCommentData = await response.json();
    const { name, createdAt, id } = newCommentData;
    addComment(text, name, createdAt, id);
  }
};

form.addEventListener("submit", handleSubmit);
