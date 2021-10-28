const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('./../models/userModel');
const catchError = require('./../util/catchError');
const AppError = require('./../util/AppError');
const sendEmail = require('../util/email');

const signUp = _id => {
  return jwt.sign({ id: _id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const resToken = (statusCode, user, res) => {
  const token = signUp(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // Remove password from output
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const filterObj = (obj, ...allowArray) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowArray.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.singnUp = catchError(async (req, res) => {
  const { name, email, photo, role, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    photo,
    role,
    password,
    passwordConfirm
  });

  resToken(200, newUser, res);
});

exports.login = catchError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !user.comparePassword(password, user.password)) {
    return next(new AppError('Incorrect email or password', 401));
  }
  const token = signUp(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

exports.protect = catchError(async (req, res, next) => {
  // Getting token and check of it's there
  let token;
  const correctToken =
    req.headers.authorization && req.headers.authorization.startsWith('Bearer');

  if (correctToken) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not login. Please log in to get access.', 401)
    );
  }

  // verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Check if user still exits
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError('The user belonging to this user dose no longer exits', 401)
    );
  }

  // Check if user change password after token was issued.
  const correctChange = user.changePasswordAfterToken(decoded.iat);
  if (correctChange) {
    return next(
      new AppError('User recently change password. Please log in again.', 401)
    );
  }

  // for restriction
  req.user = user;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchError(async (req, res, next) => {
  // 1) Get user based on POST email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Generate the random reset toeken
  const resetToken = user.createPasswordToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot password? Submit a PATCH request with your with your new password and passwordConfirm to : ${resetURL}.\nIf your did't password, Please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordExpires = undefined;
    await user.save({
      validateBeforeSave: false
    });

    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

exports.resetPassword = catchError(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  // 3) Update changePasswordAt property for the user
  // 4) Log the user in, send JWT

  resToken(200, user, res);
});

exports.updatePassword = catchError(async (req, res, next) => {
  // 1) Get user from collection (update only from after login ==> user protect middleware ) password, newPassword, newPasswordConfirm
  const { password, newPassword, newPasswordConfirm } = req.body;

  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );

  // 2) Chect if current password is correct
  if (!user.comparePassword(password, user.password)) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) if so, update
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  resToken(200, user, res);
});

exports.updateUser = catchError(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please user /updatePassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allow to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3) update user document
  const updateUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      updateUser
    }
  });
});

exports.deleteUser = catchError(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
