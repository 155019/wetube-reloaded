import { Discovery } from "aws-sdk";

const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const textarea = form.querySelector("textarea");

const addComment = (text, name, createdAt, id) => {
  const videoComments = document.querySelector(".video__comments ul");

  const newComment = document.createElement("li");
  newComment.className = "video__comment";

  const commentContainer = document.createElement("div");
  commentContainer.className = "video__comment-container";
  newComment.appendChild(commentContainer);

  const commentAvatar = document.createElement("div");
  commentAvatar.className = "video__comment-avatar";
  const commentData = document.createElement("div");
  commentData.className = "video__comment-data";
  commentContainer.appendChild(commentAvatar);
  commentContainer.appendChild(commentData);

  const commentHeader = document.createElement("div");
  commentHeader.className = "video__comment-header";
  commentData.appendChild(commentHeader);

  const avatarName = document.createElement("span");
  avatarName.className = "video__comment-owner";
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
  const editSpan = document.createElement("span");
  editSpan.className = "edit-btn";
  editSpan.innerText = "??????";
  const a = document.createElement("a");
  a.className = "delete-btn";
  a.href = `/api/comments/${id}/delete`;
  a.innerText = "??????";
  commentDelete.appendChild(editSpan);
  commentDelete.appendChild(a);
  commentData.appendChild(commentDelete);

  videoComments.prepend(newComment);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return; //text ?????? ????????? ?????? ????????? ???????????? ??????
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }, //headers??? request??? ????????? ?????? ??????, express?????? JS ???????????? ???????????? ????????? ????????? ?????? ???
    body: JSON.stringify({ text }), //textarea.value, ???????????? string??? ?????? JS ??????????????? ??????, req.body??? ?????? ???????????? ???????????? server.js??? ???????????? ??????(app.use(express.json()))
  });
  textarea.value = ""; //???????????? ?????? ??? ?????????
  if (response.status === 201) {
    const newCommentData = await response.json();
    const { name, createdAt, id } = newCommentData;
    addComment(text, name, createdAt, id);
  }
};

form.addEventListener("submit", handleSubmit);
