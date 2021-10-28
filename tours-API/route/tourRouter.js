const express = require('express');

const router = express.Router();
const tourController = require('./../controller/tourController');
const reviewRouter = require('./../route/reviewRouter');
const authController = require('./../controller/authController');

router
  .route('/')
  .get(tourController.getAllTour)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guid'),
    tourController.addTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guid'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guid'),
    tourController.deleteTour
  );

// reviews tour by tourId resource
router.use('/:tourId/reviews', reviewRouter);

module.exports = router;
