const { disconnect } = require("mongoose");

const video = document.querySelector("video");

const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");

const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");

const volumeRange = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const timeline = document.getElementById("timeline");

const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

let volumeValue = 0.5;
video.volume = volumeValue; //비디오 볼륨이 사용자가 조절히는 값이 되도록 설정

const formatTime = (seconds) =>
  new Date(seconds * 1000).toISOString().substr(14, 5);

/*
function formatTime = 
function formatDate(targetSeconds) {
const totalSeconds = parseInt(targetSeconds, 10);
let hours = Math.floor(totalSeconds / 3600);
let minutes = Math.floor((totalSeconds - hours * 3600) / 60);
let seconds = totalSeconds - hours * 3600 - minutes * 60;

hours = String(hours).padStart(2, "0");
minutes = String(minutes).padStart(2, "0");
seconds = String(seconds).padStart(2, "0");

if (hours === "00") {
return `${minutes}:${seconds}`;
}
return `${hours}:${minutes}:${seconds}`;
}
*/

const handlePlayClick = (e) => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
  playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
};

const handleMuteClick = (e) => {
  if (video.muted) {
    video.muted = false;
  } else {
    video.muted = true;
  }
  muteBtnIcon.classList = video.muted
    ? "fas fa-volume-mute"
    : "fas fa-volume-up";
  volumeRange.value = video.muted ? 0 : volumeValue; //range 값 업데이트
};

const handleVolumeChange = (event) => {
  const {
    target: { value }, //사용자가 조절하는 range 값
  } = event;
  if (video.muted) {
    video.muted = false;
    muteBtn.innerText = "Mute";
  }
  video.volume = volumeValue = value; //비디오 볼륨=사용자가 조절한 볼륨 값=음량 값
};

const handleLoadedMetadata = () => {
  if (!isNaN(video.duration)) {
    totalTime.innerText = formatTime(Math.floor(video.duration)); //span에 표시
    timeline.max = Math.floor(video.duration); //range에 표시
  }
};

const handleTimeUpdate = () => {
  currentTime.innerText = formatTime(Math.floor(video.currentTime));
  timeline.value = Math.floor(video.currentTime);
};

const handleTimelineChange = (event) => {
  const {
    target: { value },
  } = event;
  video.currentTime = value;
};

const handleFullScreen = () => {
  const fullscreen = document.fullscreenElement; //fullscreen 상태인 요소 리턴
  if (fullscreen) {
    document.exitFullscreen(); //video 요소에만 적용
    fullScreenIcon.classList = "fas fa-expand";
  } else {
    videoContainer.requestFullscreen();
    fullScreenIcon.classList = "fas fa-compress";
  }
};

let controlsTimeout = null;
let controlsMovementTimeout = null;
const hideControls = videoControls.classList.remove("showing");

const handleMouseMove = () => {
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null; //마우스가 다시 돌어왔을 때 timeout 취소(class="showing" 유지 위해서)
  }
  if (controlsMovementTimeout) {
    clearTimeout(controlsMovementTimeout);
    controlsMovementTimeout = null;
  }
  videoControls.classList.add("showing"); //처음 실행되며 timeout 생성, 마우스를 계속 움직이면 timeout 실행=취소 반복, class="showing" 유지(timeout id를 통해 취소 가능)
  controlsMovementTimeout = setTimeout(hideControls, 3000);
};

const handleMouseLeave = () => {
  controlsTimeout = setTimeout(hideControls, 3000); //마우스를 움직이지 않으면 timeout이 취소되지 않음
};

const handleKeyDown = (event) => {
  const { keyCode } = event;
  if (keyCode === 13) {
    handlePlayClick();
  }
};

const handleEnded = () => {
  const { id } = videoContainer.dataset;
  fetch(`/api/videos/${id}/view`, {
    method: "POST",
  });
};

playBtn.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMuteClick);
volumeRange.addEventListener("input", handleVolumeChange); //change = 마우스를 놓있을 때에만 결과값 표시
video.addEventListener("canplay", handleLoadedMetadata);
handleLoadedMetadata();
video.addEventListener("timeupdate", handleTimeUpdate);
video.addEventListener("ended", handleEnded);
timeline.addEventListener("input", handleTimelineChange);
fullScreenBtn.addEventListener("click", handleFullScreen);
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);
window.addEventListener("keydown", handleKeyDown);
