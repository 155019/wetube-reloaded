import "../scss/styles.scss";
import regeneratorRuntime from "regenerator-runtime";

const asideBtn = document.getElementById("asideBtn");
const asideScreen = document.querySelector("aside");

const handleAsideClick = () => {
  asideScreen.classList.toggle("hidden");
};

asideBtn.addEventListener("click", handleAsideClick);
