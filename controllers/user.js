const User = require("../models/user.js");
const ExpressError = require("../utils/express-error.js");
const { setUser } = require("../utils/jwt.js");

const handleSignIn = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.isRightUser(username, password);
  if (user.message) {
    req.flash("error", `${user.message}`);
    return res.status(200).redirect("/user/signin");
  }
  const token = setUser(user);
  res.cookie("_session_token", token);
  req.flash("success", `hey!! ${username} welcome to luminous!`);
  const redirectUrl =
    req.session.originalUrl || (user.role === "admin" ? "/admin/users" : "/");
  return res.status(200).redirect(redirectUrl);
};

const handleSignUp = async (req, res) => {
  const { username, email, password, actype } = req.body;
  const user1 = new User({
    username,
    email,
    password,
    role: actype,
  });
  user1.status = "active";
  const user2 = await User.findOne({ username }).exec();
  if (user2) {
    req.flash("error", "Username already exist!");
    return res.status(400).redirect("/user/signup");
  }
  const user3 = await User.findOne({ email }).exec();
  if (user3) {
    req.flash("error", "E-mail already exist!");
    return res.status(400).redirect("/user/signup");
  }
  await user1.save();
  const token = setUser(user1);
  res.cookie("_session_token", token);
  req.flash("success", `hey!! ${username} welcome to luminous!`);
  const redirectUrl =
    req.session.originalUrl || (actype === "admin" ? "/admin/users" : "/");
  return res.status(200).redirect(redirectUrl);
};

const handleSignOut = (req, res) => {
  res.cookie("_session_token", null);
  req.session.destroy((err) => {
    if (err) {
      throw new ExpressError(500, "session error!");
    }
  });
  return res.status(200).redirect("/");
};

const handleDeleteUser = async (req, res) => {
  const user = req.user;
  const id = user._id;
  const deletedUser = await User.deleteUser(id);
  req.flash("success", "account pruned.");
  res.cookie("_session_token", null);
  req.session.destroy((err) => {
    if (err) {
      throw new ExpressError(500, "session error!");
    }
  });
  console.log(deletedUser);
  return res.status(200).redirect("/");
};

const handleUpdateUserUsername = async (req, res) => {
  const user = req.user;
  const { username } = req.body;
  const userCheck = await User.findOne({ username });
  if (userCheck) {
    req.flash("error", "invalid username!");
    return res.status(400).redirect("/user/account");
  }
  const updatedUser = await User.findOneAndUpdate(
    { username: user.username },
    { username },
    { new: true }
  );
  req.user = updatedUser;
  const token = setUser(updatedUser);
  res.cookie("_session_token", token);
  req.flash("success", "username updated!");
  return res.status(200).redirect("/user/account");
};

const handleChangeUserPassword = async (req, res) => {
  const user = req.user;
  const { password } = req.body;
  const userCheck = await User.isRightUser(user.username, password.old);
  if (userCheck.message) {
    req.flash("error", `${userCheck.message}`);
    return res.status(401).redirect("/user/account");
  }
  userCheck.password = password.new;
  await userCheck.save();
  req.flash("success", "password updated!");
  return res.status(200).redirect("/user/account");
};

module.exports = {
  handleSignUp,
  handleSignIn,
  handleSignOut,
  handleDeleteUser,
  handleUpdateUserUsername,
  handleChangeUserPassword,
};
