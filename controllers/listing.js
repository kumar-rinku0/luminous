const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");
const ExpressError = require("../utils/express-error");

// geocoding
const mbxGeoCoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAPBOX_DEFULT_TOKEN;
const geocodingClient = mbxGeoCoding({ accessToken: mapToken });

// post review
const handlePostReview = async (req, res) => {
  let user = req.user;
  const { id } = req.params;
  const { rating, msg } = req.body;
  if (id.toString().length != 24) {
    throw new ExpressError(400, "Listing id is incorrect!!");
  }
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not Found!!");
  }
  if (listing.createdBy.toString() === user._id.toString()) {
    throw new ExpressError(403, "You can't rate your own listing!!");
  }
  const popListing = await Listing.findById(id).populate("reviews");
  const reviews = popListing.reviews.filter((value) => {
    return value.username === user.username;
  });
  if (reviews[0] && (rating || msg)) {
    const review = reviews[0];
    review.rating = rating || review.rating;
    review.msg = msg || review.msg;
    await review.save();
    return res.status(201).redirect(`/listings/${listing._id}`);
  }
  if (!rating) {
    throw new ExpressError(400, "Bad Req!! No rating stars provided.");
  }
  if (!msg.trim()) {
    throw new ExpressError(400, "Bad Req!! No msg.");
  }
  const review = new Review({
    rating,
    msg,
    username: user.username,
  });
  listing.reviews.push(review);
  await review.save();
  await listing.save();
  return res.status(201).redirect(`/listings/${listing._id}`);
};

const handleDeleteListing = async (req, res) => {
  const { id, createdBy } = req.params;
  if (id.length != 24 || createdBy.length != 24) {
    throw new ExpressError(400, "Incorrect listing!!");
  }
  let user = req.user;
  // const listing = await Listing.findById(id);
  if (user._id.toString() !== createdBy) {
    throw new ExpressError(401, "Unauthorized pruning!!");
  }
  await Listing.findByIdAndDelete(id);
  req.flash("success", "listing pruned!!");
  return res.status(200).redirect("/listings");
};

const handleCreateLising = async (req, res) => {
  const { listing } = req.body;
  const response = await geocodingClient
    .forwardGeocode({
      query: `${listing.location.value} ${listing.location.country}`,
      limit: 1,
    })
    .send();
  const geometry = response.body.features[0].geometry;
  const { filename, path: url } = req.file;
  let user = req.user;
  const newListing = new Listing(listing);
  newListing.image = { filename, url };
  newListing.createdBy = user._id;
  newListing.location.geometry = geometry;
  await newListing.save();
  req.flash("success", "listing saved!");
  return res.status(200).redirect(`/listings/${newListing._id}`);
};

const handleUpdateLising = async (req, res) => {
  let user = req.user;
  const { listing } = req.body;
  const filename = req?.file?.filename;
  const url = req?.file?.path;
  const { id } = req.params;
  if (id.length != 24) {
    req.flash("success", "invalid listing info!!");
    return res.redirect(`/listings/user/${user.username}`);
  }
  const newListing = await Listing.findById(id);
  newListing.title = listing.title;
  newListing.description = listing.description;
  if (newListing.location.value !== listing.location.value) {
    newListing.location.value = listing.location.value;
    newListing.location.country = listing.location.country;
    const response = await geocodingClient
      .forwardGeocode({
        query: `${listing.location.value} ${listing.location.country}`,
        limit: 1,
      })
      .send();
    const geometry = response.body.features[0].geometry;
    newListing.location.geometry = geometry;
  }
  newListing.image = filename && url ? { filename, url } : newListing.image;
  await newListing.save();
  req.flash("success", "listing updated!");
  return res.status(200).redirect("/listings");
};

const handleReadUsernameListing = async (req, res) => {
  let user = req.user;
  const { username } = req.params;
  if (username !== user.username.toString()) {
    throw new ExpressError(400, "Bad Requiest!! incorrect username!");
  }
  const listings = await Listing.find({ createdBy: user._id }).sort({
    createdAt: -1,
  });
  return res.status(200).render("listings.ejs", {
    listings,
    user,
    myListings: true,
    title: "my listings!!",
  });
};

const handleReadListing = async (req, res) => {
  let user = req.user || null;
  const { id } = req.params;
  if (id.toString().length != 24) {
    throw new ExpressError(400, "Listing id is incorrect!!");
  }
  const listing = await Listing.findById(id).populate("reviews");
  const listingCreatedBy = await User.findById(listing.createdBy);
  if (user && listing.createdBy === user._id) {
    listingCreatedBy = null;
  }
  if (!listing) {
    // throw new ExpressError(404, "Listing Not Found!!");  // async fuction can throw errors this only if they are wrapped with async_wrapper.
    throw new ExpressError(404, "Listing not Found!!");
  }
  return res.status(200).render("listing.ejs", {
    listing,
    user,
    accessToken: process.env.MAPBOX_DEFULT_TOKEN,
    listingCreatedBy,
    title: "listing based on title",
  });
};

module.exports = {
  handlePostReview,
  handleDeleteListing,
  handleReadUsernameListing,
  handleCreateLising,
  handleUpdateLising,
  handleReadListing,
};
