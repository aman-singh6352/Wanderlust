const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    filename: {
      type: String,
    },
    url: {
      type: String,
      required: false,
      set: (v) =>
        v === ""
          ? "https://www.shutterstock.com/image-photo/round-igloo-icehouse-snowhouse-yurt-260nw-1065009836.jpg"
          : v,
    },
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing.reviews.length) {
    await Review.deleteMany({ _id: { $in: listing.reviews } }).catch((err) => {
      console.log(err);
    });
  }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
