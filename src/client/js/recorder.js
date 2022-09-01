import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const actionBtn = document.getElementById("actionBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const files = {
  input: "recording.webm",
  output: "output.mp4",
  thumb: "thumbnail.jpg",
};

const downloadFile = (fileUrl, fileName) => {
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
};

const handleDownload = async () => {
  actionBtn.removeEventListener("click", handleDownload);
  actionBtn.innerText = "Transcoding...";
  actionBtn.disabled = true;

  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();

  ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile)); //파일 생성

  await ffmpeg.run("-i", files.input, "-r", "60", files.output); //mp4로 변환

  await ffmpeg.run(
    "-i",
    files.input,
    "-ss",
    "00:00:01",
    "-frames:v",
    "1", //스크린샷
    files.thumb
  );

  const mp4File = ffmpeg.FS("readFile", files.output); //mp4파일 불러옴
  const thumbFile = ffmpeg.FS("readFile", files.thumb); //mp4파일 불러옴

  const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" }); //readFile의 리턴 값은 Uint8Array(숫자 배열), blob(binary 정보를 가지는 파일, binary data에 접근하기 위해 buffer 사용)
  const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });

  const mp4Url = URL.createObjectURL(mp4Blob);
  const thumbUrl = URL.createObjectURL(thumbBlob);

  downloadFile(mp4Url, "MyRecording.mp4");
  downloadFile(thumbUrl, "MyThumbnail.jpg");

  ffmpeg.FS("unlink", files.input);
  ffmpeg.FS("unlink", files.output);
  ffmpeg.FS("unlink", files.thumb);

  URL.revokeObjectURL(mp4Url);
  URL.revokeObjectURL(thumbUrl);
  URL.revokeObjectURL(videoFile);

  actionBtn.disabled = false;
  actionBtn.innerText = "Record Again";
  actionBtn.addEventListener("click", handleStart);
};

const handleStart = () => {
  actionBtn.innerText = "Recording";
  actionBtn.disabled = true;
  actionBtn.removeEventListener("click", handleStart);

  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  recorder.ondataavailable = (event) => {
    //녹화 멈추면 발생
    videoFile = URL.createObjectURL(event.data); //브라우저의 메모리에 파일 저장, 브라우저가 파일에 접근할 수 있는 url 줌(blob)
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();

    actionBtn.innerText = "Download";
    actionBtn.disabled = false;
    actionBtn.addEventListener("click", handleDownload);
  };
  recorder.start();
  setTimeout(() => {
    recorder.stop();
  }, 5000);
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    //mediaDevices = 마이크, 카메라 등 미디어 장비 접근
    audio: false,
    video: {
      width: 1024,
      height: 576,
    },
  });
  video.srcObject = stream; //HTML의 media 요소와 연결, 소스 역할을 하는 객체를 설정하거나 반환
  video.play(); //카메라가 stream을 받아온 후 video 요소에 담음
};

init();

actionBtn.addEventListener("click", handleStart);
