const Listing = require("../models/List.js");

module.exports.index = async (req, res) => {
  const lists = await Listing.find();
  res.render("showlist.ejs", { lists });
};

module.exports.showListings = async (req, res, next) => {
  let id = req.params.id;
  let listing = [];
  await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner")
    .then((res) => {
      listing = res;
    });
  if (!listing) {
    return next({ status: 404, message: "Listing not found" });
  }
  res.render("show.ejs", { listing });
  // no more advantage of try catch u can use db error handler
};

module.exports.renderNewForm = (req, res) => {
  res.render("new.ejs");
};

module.exports.createListing = async (req, res) => {
  let newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image.filename = req.file.originalname;
  newListing.image.url = req.file.path;
  if (newListing.image.url == undefined) {
    newListing.image.url = "";
  }
  await newListing.save().catch((err) => {
    next(err);
  });
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.editListingForm = async (req, res) => {
  let id = req.params.id;
  let listing = await Listing.findById(id);
  res.render("edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  let id = req.params.id;
  let updatedListing = new Listing(req.body.listing);
  updatedListing._id = id;
  let listing = await Listing.findByIdAndUpdate(id, updatedListing).catch(
    (err) => {
      console.log(err);
    }
  );
  if (typeof req.file !== "undefined") {
    listing.image.url = req.file.path;
    listing.image.filename = req.file.originalname;
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect("/listings");
};

module.exports.deleteListing = async (req, res) => {
  let id = req.params.id;
  await Listing.findByIdAndDelete(id).catch((err) => {
    next(err);
  });
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
  let country = req.query.country;
  let listings = await Listing.find({
    country: { $regex: country, $options: "i" },
  });
  if (listings.length === 0) {
    req.flash("error", "Nothing is found!");
    return res.redirect("/listings");
  }
  res.render("searched.ejs", { listings });
};
