require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const hbs = require("express-handlebars");
const Handlebars = require("handlebars");
const app = express();
const db = require("./config/connection");
const session = require("express-session");
const multer = require("multer");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

const Hbs = hbs.create({});

Hbs.handlebars.registerHelper("if_eq", function (a, b, opts) {
  if (a == b) return opts.fn(this);
  else return opts.inverse(this);
});

app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layouts",
    partialsDir: __dirname + "/views/partials",
  })
);
Handlebars.registerHelper("inc", function (value, options) {
  return parseInt(value) + 1;
});
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "furniture",
    cookie: { maxAge: 600000 },
    resave: true,
    saveUninitialized: false,
  })
);

//  mongo connection
db.connect((err) => {
  if (err) console.log("Database Connection error" + err);
  else console.log("Database connected ");
});

app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  // next(createError(404));
  res.status(404).render("404");
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
