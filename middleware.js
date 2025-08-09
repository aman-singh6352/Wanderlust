const Listing = require("./models/List.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.redirectUrl = req.originalUrl;
  req.flash("error", "You must be logged in!");
  res.redirect("/login");
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let id = req.params.id;
  let listing = await Listing.findById(id);
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You don't have permission");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You don't have permission");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.Geocoding = async (req, res, next) => {
  let id = req.params.id;
  let listing = await Listing.findById(id);
  const myAddress = `${listing.location}, ${listing.country}`;
  const encodedAddress = encodeURIComponent(myAddress);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.MAP_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();// the api is giving error
  // const location = data.results[0].geometry.location;
  // console.log(data);
  next();
};
