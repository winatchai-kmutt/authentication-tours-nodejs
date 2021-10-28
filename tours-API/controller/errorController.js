const AppError = require('../util/AppError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperation) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    console.log('someting went very wrong');
    res.status(500).json({
      status: 'errors',
      message: 'contract DEV Back-End'
    });
  }
};

// handle Error for productive
const handleDuplicate = err => {
  const message = `Duplicate : ${err.keyValue.name}`;
  return new AppError(message, 500);
};

const handleCastError = err => {
  const message = `Invalid ID: ${err.value}`;
  return new AppError(message, 500);
};

const handleValidation = err => {
  const message = Object.values(err.errors).map(el => {
    return el.message;
  });
  return new AppError(`Validation error: ${message.join(', ')}`, 500);
};

const handleJWTTokenErr = () => {
  return new AppError('Invalid token, Please log in again.', 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'errors';
  if (process.env.NODE_ENV === 'deverlopment') {
    // sendErrorDev
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'productive') {
    // sendErrorProd
    if (err.code === 11000) err = handleDuplicate(err);
    if (err.name === 'CastError') err = handleCastError(err);
    if (err.name === 'ValidationError') err = handleValidation(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTTokenErr();
    sendErrorProd(err, res);
  }
};
