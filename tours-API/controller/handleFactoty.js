const catchError = require('./../util/catchError');
const AppError = require('./../util/AppError');
const AppFearture = require('./../util/AppFearture');

exports.deleteOne = Model =>
  catchError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError(`Can't find ${req.params.id} on this server.`));
    }
    res.status(204).json({
      status: 'success'
    });
  });

exports.updateOne = Model =>
  catchError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError(`Can't find ${req.params.id} on this server`));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.createOne = Model =>
  catchError(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc
    });
  });

exports.getOne = (Model, popOption) =>
  catchError(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOption) query = query.populate(popOption);
    const doc = await query;

    if (!doc) {
      return next(new AppError(`Can't find ${req.params.id} on this server`));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = Model =>
  catchError(async (req, res) => {
    // to Allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const fearture = new AppFearture(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const doc = await fearture.query;

    res.status(200).json({
      status: 'success',
      result: doc.length,
      message: doc
    });
  });
