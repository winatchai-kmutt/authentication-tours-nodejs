const Review = require('./../models/reviewModel');
const factory = require('./../controller/handleFactoty');

exports.setTourIdAndUserId = (req, res, next) => {
  // Allow nested routes /tours/614b0a459f743430d7f62728/reviews
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.getAllReview = factory.getAll(Review);
exports.addReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
