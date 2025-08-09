if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const mongoose = require("mongoose");
const Listing = require("./models/List.js");
const Review = require("./models/review.js");
const User = require("./models/user.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { resourceLimits } = require("worker_threads");
const listing = require("./controllers/listing.js");
const review = require("./controllers/review.js");
const user = require("./controllers/user.js");
const {
  isLoggedIn,
  isOwner,
  saveRedirectUrl,
  isAuthor,
} = require("./middleware.js");
const multer = require("multer");
const { storage } = require("./cloudConfig.js");
const upload = multer({ storage });

const app = express();
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.ATLAS_DB_URL).catch((err) => {
    console.log(err);
  });
}
const store = MongoStore.create({
  mongoUrl: process.env.ATLAS_DB_URL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});
store.on("error", () => {
  console.log(err);
});

// MARK:SESSION
const sessionOptions = {
  store: store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true, // cross scripting attack
  },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.user;
  res.locals.MAP_API_KEY = process.env.MAP_API_KEY;
  next();
});
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.listen(8080, (req, res) => {
  console.log("Server is listening on port 8080");
});

app.get("/", (req, res) => {
  res.redirect("/listings");
});

//MARK:LISTING
// Create route
app.get("/listing/new", isLoggedIn, listing.renderNewForm);

function asyncWrap(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => {
      return next(err);
    });
  };
}

app.get("/listings", listing.index);

// Show route
app.get("/listings/:id", asyncWrap(listing.showListings));

//Create Route
app.post(
  "/listings",
  upload.single("listing[image]"),
  isLoggedIn,
  listing.createListing
);

app.get("/listings/:id/edit", isLoggedIn, listing.editListingForm);

// Update route
app.put(
  "/listings/:id",
  upload.single("listing[image]"),
  isOwner,
  isLoggedIn,
  listing.updateListing
);

// Delete route
app.delete("/listings/:id", isLoggedIn, isOwner, listing.deleteListing);4

// Search Route
app.get("/searching", listing.searchListings);

// MARK:REVIEW
// Review Create route
app.post("/listings/:id/reviews", isLoggedIn, review.reviewCreate);

// Review delete route
app.get(
  "/listing/:id/review/:reviewId",
  isLoggedIn,
  isAuthor,
  review.reviewDelete
);

//MARK:USER
app.get("/signup", user.signupForm);

app.post("/signup", user.signup);

app.get("/login", user.loginForm);

app.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  user.login
);

app.get("/logout", user.logout);

// MARK:ERROR
app.use((req, res) => {
  return res
    .status(404)
    .render("error.ejs", { status: 404, message: "Page Not Found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs", { status, message });
});
