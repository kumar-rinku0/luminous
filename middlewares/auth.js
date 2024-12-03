// user is logged in or not check.
const ExpressError = require("../utils/express-error.js");
const { getUser } = require("../utils/jwt.js");

const isLoggedInCheck = (req, res, next) => {
  let user = getUser(req.cookies?._session_token);
  req.user = user;
  return next();
};

const onlyLoggedInUser = (req, res, next) => {
  req.session.originalUrl = req.originalUrl;
  let user = req.user;
  if (!user || user == null) {
    user = getUser(req.cookies?._session_token);
    req.user = user;
  }
  if (!user && !req?.baseUrl) {
    return res.redirect("/user/signin");
  }
  if (!user) {
    // throw new ExpressError(401, "session expired. login again!!");
    return res.redirect("/user/signin");
  }
  if (user.status !== "active") {
    throw new ExpressError(401, "unauthorized req. or blocked by admin!!");
  }
  return next();
};

const isAdmin = (req, res, next) => {
  const user = req.user;
  if (user.role !== "admin") {
    throw new ExpressError(403, "forbiden page!!");
  }
  return next();
};

// flash middleware
const setFlash = (req, res, next) => {
  res.locals.flash_success = req.flash("success");
  res.locals.flash_error = req.flash("error");
  console.log(res.locals.flash_error, res.locals.flash_success);
  return next();
};

module.exports = {
  isLoggedInCheck,
  onlyLoggedInUser,
  isAdmin,
  setFlash,
};
