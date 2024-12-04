const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");
const ExpressError = require("../utils/express-error");

// geocoding
const mbxGeoCoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAPBOX_DEFULT_TOKEN;
const geocodingClient = mbxGeoCoding({ accessToken: mapToken });

// post review
const handleCreateReview = async (req, res) => {
  let user = req.user;
  const { id } = req.params;
  const { rating, msg } = req.body;
  const listing = await Listing.findById(id);

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
  return res.status(200).redirect("/");
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
  newListing.price = listing.price;
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
  return res.status(200).redirect(`/listings/${newListing._id}`);
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
    // throw new ExpressError(400, "Listing id is incorrect!!");
    req.flash("error", "Listing id is incorrect!!");
    return res.status(400).redirect("/listings");
  }
  const listing = await Listing.findById(id).populate("reviews");
  if (!listing) {
    req.flash("error", "Listing id is invalid!!");
    return res.status(400).redirect("/listings");
  }
  const listingCreatedBy = await User.findById(listing.createdBy);
  if (user && listing.createdBy === user._id) {
    listingCreatedBy = null;
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
  handleCreateReview,
  handleDeleteListing,
  handleReadUsernameListing,
  handleCreateLising,
  handleUpdateLising,
  handleReadListing,
};
