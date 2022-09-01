import express from "express";
import {
  getEdit,
  postEdit,
  logout,
  startGithubLogin,
  finishGithubLogin,
  see,
  getChangePassword,
  postChangePassword,
} from "../controllers/userController";
import {
  protectorMiddleware,
  publicOnlyMiddleware,
  avatarUpload,
} from "../middlewares";

const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter
  .route("/edit")
  .all(protectorMiddleware) //all은 모든 http 메소드에 적용
  .get(getEdit)
  .post(avatarUpload.single("avatar"), postEdit); //템플릿의 input에서 오눈 avatar 파일(single이므로 1개)을 업로드학고 uploads 폴더에 저장, postEdit에 파일 정보를 전달(req.file 사용 가능)
userRouter
  .route("/change-password")
  .all(protectorMiddleware)
  .get(getChangePassword)
  .post(postChangePassword);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/finish", publicOnlyMiddleware, finishGithubLogin);
userRouter.get("/:id", see);

export default userRouter;
