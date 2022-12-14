import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  socialOnly: { type: Boolean, default: false },
  username: { type: String, required: true, unique: true },
  password: { type: String },
  email: { type: String, required: true, unique: true },
  avatarUrl: { type: String },
  location: String,
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    //비밀번호가 수정될 때만 해싱
    this.password = await bcrypt.hash(this.password, 5); //this는 userController에서 create되는 User을 의미
  }
}); //await 사용하므로 hash 뒤에 함수 필요 없음

const User = mongoose.model("User", userSchema);
export default User;
