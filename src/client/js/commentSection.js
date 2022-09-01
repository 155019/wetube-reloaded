const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");

const deleteCommentAll = document.querySelectorAll(".video__comment-delete");

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const span = document.createElement("span");
  span.innerText = `${text}`;
  const span2 = document.createElement("span");
  span2.innerText = "x";
  span2.className = "video__comment-delete";
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);
};

const deleteComment = (e) => {
  const commentContainer = document.querySelector(".video__comments ul");
  const commentList = e.target.parentNode;
  commentContainer.removeChild(commentList);
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
  if (response.status === 201) {
    textarea.value = ""; //데이터를 보낸 후 비워줌
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
    deleteComment = document.getElementById("delete__comment");
    deleteComment.removeEventListener("click", handleDelete);
    deleteComment.addEventListener("click", handleDelete);
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}

const handleDelete = async (e) => {
  const commentList = e.target.parentNode;
  const commentId = commentList.dataset.id;
  await fetch(`/api/comments/${commentId}/delete`, {
    method: "DELETE",
  });
  commentList.remove();
};

if (deleteCommentAll) {
  deleteCommentAll.forEach((deleteComment) => {
    deleteComment.addEventListener("click", handleDelete);
  });
}
