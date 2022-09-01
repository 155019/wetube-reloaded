import User from "../models/User";
import fetch from "cross-fetch"; //npm i node-fetch 작동하지 않음
import bcrypt from "bcrypt";
import { token } from "morgan";

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });
export const postJoin = async (req, res) => {
  const { name, username, email, password, password2, location } = req.body;
  const pageTitle = "Join";
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "Password confirmation does not match.",
    });
  }
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "This username/email is already taken.",
    });
  }
  try {
    await User.create({
      name,
      username,
      email,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: error._message,
    });
  }
};

export const getLogin = (req, res) =>
  res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "An account with this username does not exist.",
    });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "Wrong password",
    });
  }
  req.session.loggedIn = true; //req.session 오브젝트에 임의로 정보 저장
  req.session.user = user; //DB에서 찾은 user
  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString(); //url 형식으로 인코딩
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET, //백엔드에만 존재하므로 반드시 .env 파일에 작성
    code: req.query.code, //요청 url에 있음
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`; //finalUrl에 POST 요청(redirect하지 않음)
  const tokenRequest = await (
    await fetch(finalUrl, {
      //fetch(url)로 다른 서버를 통해 데이터를 가져옴, fetch 자체는 nodejs 백엔드에서 동작하지 않음
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    //Github API에 액세스하는 과정에서 사용
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        //user 프로필 요청
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    ); //email array에서 primary, verified된 것을 찾음
    if (!emailObj) {
      //notification(Github으로 로그인했음을 알려 줌)
      return res.redirect("/login"); //찾지 못한 경우 로그인 페이지로 돌어감
    }
    let user = await User.findOne({ email: emailObj.email }); //primary, verified 이메일을 찾으면 DB에서 해당 이메일 찾고 로그안
    if (user) {
      //user 찾지 못하면 새로 만든 user로 정의
      user = User.create({
        avatarUrl: userData.avatar_url,
        name: userData.name,
        username: userData.login,
        email: emailObj.email,
        password: "", //pw 설정 없이 Github 데이터로 로그인(User.js의 schema에서 required 제거 필요)
        socialOnly: true, //pw 없이 소셜 계정으로(Github) 로그인하는 경우
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/"); //계정이 있는 경우 함수 거치지 않고 로그인됨
  } else {
    return res.redirect("/login");
  }
};

export const logout = (req, res) => {
  req.session.user = null;
  res.locals.loggedInUser = req.session.user;
  req.session.loggedIn = false;
  return res.redirect("/");
};

export const getEdit = (req, res) => {
  return res.render("edit-profile", { pageTitle: "Edit Profile" });
};
export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl }, //req.session.user=로그인한 사용자
    },
    body: { name, email, username, location },
    file,
  } = req;
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      //로그인 후 session을 변경하지 얺기 때문에 DB가 업데이트되어도 user 정보가 바뀌지 않음(session 업데이트 통해 해결)
      avatarUrl: file ? file.path : avatarUrl, //변경된 파일 존재하지 않으면 기존 avatarUrl을 사용(파일 바뀌지 않으면 file.path 사용 불가) DB에는 파일 절대 저장하지 않음, 위치만
      name,
      email,
      username,
      location, //form에 입력한 name으로부터
    },
    { new: true }
  );
  req.session.user = updatedUser;
  return res.redirect("/");
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Can't change password");
    return res.redirect("/");
  }
  return res.render("change-password", { pageTitle: "Change Password" });
};
export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { oldPassword, newPassword, newPasswordConfirmation },
  } = req;
  const user = await User.findById(_id); //세션으로부터 로그안한 user 가져옴(userSchema.pre 사용하기 위해)
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    //기존 비밀번호가 정확한지
    return res.status(400).render("change-password", {
      pageTitle: "Change Password",
      errorMessage: "The current password is incorrect",
    });
  }
  if (newPassword !== newPasswordConfirmation) {
    return res.status(400).render("change-password", {
      pageTitle: "Change Password",
      errorMessage: "The password does not match the confirmation",
    });
  }
  user.password = newPassword; //세션 업데이트(updatedUser와 동일)
  await user.save(); //userSchema.pre("save") 작동하려면 create 또는 save 필요하므로(새로운 password 해싱, promise이므로 await)
  req.flash("info", "Password updated");
  return res.redirect("/users/logout");
};

export const see = async (req, res) => {
  const { id } = req.params; //로그아웃 상태에서 접근 가능하므로 req.session 대신 req.params
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User",
    },
  });
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found" });
  }
  //const videos = await Video.find({ owner: user._id }); 특정 사용자가 업로드한 영상(owner의 id와 params의 id가 같은 경우)
  return res.render("profile", { pageTitle: user.name, user });
};
