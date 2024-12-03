if (process.env.NODE_ENV != "development") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const ejsMate = require("ejs-mate");

// database connection
const connection = require("./utils/init.js");

// routers
const listingRouter = require("./routes/listing.js");
const userRouter = require("./routes/user.js");

// middlewares
const adminRouter = require("./routes/admin.js");
const {
  onlyLoggedInUser,
  isAdmin,
  isLoggedInCheck,
  setFlash,
} = require("./middlewares/auth.js");

const app = express();
const PORT = process.env.PORT || 8000;

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// session
const MONGO_URI = process.env.MONGO_URI;
const store = MongoStore.create({
  mongoUrl: MONGO_URI,
  touchAfter: 24 * 3600,
  crypto: {
    secret: process.env.SESSION_SECRET || "KEYBOARD & mE!",
  },
  ttl: 7 * 24 * 60 * 60,
});

store.on("error", (err) => {
  console.log("ERROR WHILE STORING SESSIONS!", err);
});

const sessionOptions = {
  store,
  secret: process.env.SESSION_SECRET || "KEYBOARD & mE!",
  genid: (req) => {
    return randomUUID();
  },
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.set("trust proxy", 1);
app.use(session(sessionOptions));
app.use(flash());
// database connection.
connection();

// root route
app.get("/", (req, res) => {
  res.status(200).redirect("listings");
});

app.use(setFlash);
// route middleware
app.use("/user", userRouter);
app.use("/listings", isLoggedInCheck, listingRouter);
app.use("/admin", onlyLoggedInUser, isAdmin, adminRouter);

// err middleware
app.use((err, req, res, next) => {
  const { status = 500, message } = err;
  let user = req.user;
  if (!user) {
    res
      .status(status)
      .render("error.ejs", { message, title: `${status} !!`, user: null });
  }
  res
    .status(status)
    .render("error.ejs", { message, title: `${status} !!`, user });
});

app.listen(PORT, () => {
  console.log("app is listening on PORT", PORT);
});
