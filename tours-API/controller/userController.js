const User = require('./../models/userModel');

const catchError = require('./../util/catchError');
const factory = require('./../controller/handleFactoty');

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};
exports.getAllUser = factory.getAll(User);

// user this router after LOGIN | use protect, getMe middleware before
exports.getUser = factory.getOne(User);

exports.createUser = catchError(async (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not difine. Please use SigUp instead.'
  });
});
