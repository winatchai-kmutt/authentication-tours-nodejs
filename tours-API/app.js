const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./util/AppError');

const app = express();

const tourRouter = require('./route/tourRouter');
const userRouter = require('./route/userRouter');
const errorController = require('./controller/errorController');
const reviewRouter = require('./route/reviewRouter');

//1) GLOBAL MIDDLEWARE
//Set security HTTP headers
app.use(helmet());

// Deverlopment looging
if (process.env.NODE_ENV === 'deverlopment') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body paser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against  NoSQL injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//prevent parametor pollution ?fields=name&fields=price
app.use(
  hpp({
    whitelist: ['price', 'difficulty', 'maxGroupSize']
  })
);

//handle LING
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.all('*', (req, res, next) => {
  return next(
    new AppError(`Can't find ${req.originalUrl} on this server.`, 404)
  );
});

app.use(errorController);

module.exports = app;
