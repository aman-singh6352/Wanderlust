const User = require("../models/user.js");

module.exports.signupForm = (req, res) => {
  res.render("signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { password, username, email } = req.body;
    const newUser = new User({ email, username });
    let regUser = await User.register(newUser, password);
    req.login(regUser, (err) => {
      if (err) return next();
      req.flash("success", "User Registered!");
      res.redirect("/listings");
    });
  } catch (e) {
    if (e.code == 11000) {
      req.flash("error", "Email is already registered!");
      res.redirect("/signup");
    } else {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  }
};

module.exports.loginForm = (req, res) => {
  res.render("login.ejs");
};

module.exports.login = (req, res) => {
  const redirectUrl = res.locals.redirectUrl || "/listings";
  res.redirect(redirectUrl);
};

module.exports.logout = async (req, res) => {
  req.logOut((err) => {
    if (err) {
      return next();
    }
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};
