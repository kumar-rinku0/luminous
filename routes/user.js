const { Router } = require("express");
const { onlyLoggedInUser } = require("../middlewares/auth.js");
const wrapAsync = require("../utils/wrap-async.js");
const ExpressError = require("../utils/express-error.js");
const User = require("../models/user.js");
const { setUser } = require("../utils/jwt.js");
const route = Router();

// sign in get requist
route
  .route("/signin")
  .get((req, res) => {
    return res
      .status(200)
      .render("signin.ejs", { title: "signin page!", user: null });
  })
  .post(
    wrapAsync(async (req, res) => {
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
        req.session.originalUrl ||
        (user.role === "admin" ? "/admin/users" : "/");
      return res.status(200).redirect(redirectUrl);
    })
  );

// sign up get requist
route
  .route("/signup")
  .get((req, res) => {
    return res
      .status(200)
      .render("signup.ejs", { title: "signup page!", user: null });
  })
  .post(
    wrapAsync(async (req, res) => {
      const { username, email, password, actype } = req.body;
      console.log(actype);
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
      console.log(req.user);
      req.flash("success", `hey!! ${username} welcome to luminous!`);
      const redirectUrl =
        req.session.originalUrl || (actype === "admin" ? "/admin/users" : "/");
      return res.status(200).redirect(redirectUrl);
    })
  );

// sign out requist
route.get("/signout", (req, res) => {
  res.cookie("_session_token", null);
  req.session.destroy((err) => {
    if (err) {
      throw new ExpressError(500, "session error!");
    }
  });
  return res.status(200).redirect("/");
});

route.get("/account", onlyLoggedInUser, (req, res) => {
  const user = req.user;
  return res.render("account.ejs", { title: "account settings...", user });
});

route.delete("/destroy", onlyLoggedInUser, async (req, res) => {
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
});

module.exports = route;
