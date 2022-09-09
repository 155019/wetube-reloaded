import User from "../models/User";
import Comment from "../models/Comment";
import Video from "../models/Video";

export const home = async (req, res) => {
  const videos = await Video.find({})
    .sort({ createdAt: "desc" })
    .populate("owner");
  return res.render("home", { pageTitle: "홈", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate("owner").populate("comments");
  if (!video) {
    return res.render("404", { pageTitle: "비디오가 없습니다." });
  }
  return res.render("watch", { pageTitle: video.title, video });
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id); //postEdit과 달리 exists() 쓰지 않음, video 오브젝트가 필요(edit 템플릿으로 보내주어야 함)
  if (!video) {
    return res.status(404).render("404", { pageTitle: "비디오가 없습니다." }); //return 작성하지 않으면 함수가 종료되지 않음
  }
  //owner만 edit, delete 페이지에 접근 가능
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "권한이 없습니다.");
    return res.status(403).redirect("/");
  }
  return res.render("edit", {
    pageTitle: `${video.title} 수정`,
    video,
  });
};

export const postEdit = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { id } = req.params;
  const { title, description, hashtags } = req.body;
  const video = await Video.findById(id); //오브젝트의 id가 req.params의 id와 같은 경우를 찾음
  if (!video) {
    return res.status(404).render("404", { pageTitle: "비디오가 없습니다." }); //return 작성하지 않으면 함수가 종료되지 않음
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "비디오의 소유자가 아닙니다.");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags),
  });
  req.flash("success", "변경사항이 저장되었습니다.");
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("upload", { pageTitle: "비디오 업로드" });
};

export const postUpload = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { video, thumb } = req.files; //ES6
  const { title, description, hashtags } = req.body;
  const isHeroku = process.env.NODE_ENV === "production";
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: isHeroku ? video[0].location : video[0].path,
      thumbUrl: isHeroku ? thumb[0].location : thumb[0].path,
      owner: _id, //video owner로 req.session.user를 할당할 것임을 의미
      hashtags: Video.formatHashtags(hashtags),
    });

    const user = await User.findById(_id);
    user.videos.push(newVideo._id); //newVideo의 id를 User model의 videos array에 추가
    user.save(); //save할 때마다 userSchema.pre("save") 실행,
    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("upload", {
      pageTitle: "비디오 업로드",
      errorMessage: error._message, //mongoose에 의한 변수
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", { pageTitle: "비디오가 없습니다." });
  }
  if (String(video.owner) !== String(_id)) {
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(`${keyword}$`, "i"),
      },
    }).populate("owner");
  }
  return res.render("search", { pageTitle: "검색", videos });
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  } else {
    video.meta.views = video.meta.views + 1;
    await video.save();
    return res.sendStatus(200);
  }
};

export const createComment = async (req, res) => {
  const {
    params: { id },
    body: { text },
    session: { user },
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text,
    owner: user._id, //type: mongoose.Schema.Types.ObjectId
    video: id,
  });
  video.comments.push(comment._id); //새로 만들어진 comment의 _id
  video.save();

  const owner = await User.findById(user._id);
  owner.comments.push(comment._id);
  owner.save();

  return res
    .status(201)
    .json({ name: owner.name, createdAt: comment.createdAt, id: comment._id });
};

export const deleteComment = async (req, res) => {
  const {
    params: { id },
    session: {
      user: { _id },
    },
  } = req;
  const comment = await Comment.findById(id);
  const user = await User.findById(_id);
  const video = await Video.findById(comment.video);
  if (!comment) {
    return res.status(400).render("404", { pageTitle: "댓글이 없습니다." });
  }
  if (String(comment.owner._id) !== String(_id)) {
    return res.sendStatus(404);
  }
  await Comment.findByIdAndDelete(id);
  user.comments.splice(user.comments.indexOf(id), 1);
  user.save();

  video.comments.splice(video.comments.indexOf(id), 1);
  video.save();

  return res.redirect(`/videos/${video._id}`);
};
