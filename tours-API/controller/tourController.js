const Tour = require('./../models/tourModel');
const factory = require('./../controller/handleFactoty');

exports.getAllTour = factory.getAll(Tour);
exports.addTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
