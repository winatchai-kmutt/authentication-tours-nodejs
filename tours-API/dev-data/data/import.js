const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');

let Model;
const Tour = require('../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

dotenv.config({ path: './../../config.env' });

console.log(process.argv);
const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log('DB connected');
  });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`));

const importData = async () => {
  try {
    let doc;
    if (process.argv[2] === '--tours') doc = tours;
    if (process.argv[2] === '--users') doc = users;
    if (process.argv[2] === '--reviews') doc = reviews;
    await Model.create(doc);
    console.log('import success');
  } catch (err) {
    console.log(err);
  }
  process.exit(0);
};

const deleteData = async () => {
  try {
    await Model.deleteMany({});
    console.log('delete success');
  } catch (err) {
    console.log(err);
  }
  process.exit(0);
};

const showData = async () => {
  try {
    const docs = await Model.find();
    console.log(docs);
  } catch (err) {
    console.log(err);
  }
  process.exit(0);
};

// select Model
if (process.argv[2] === '--users') {
  Model = User;
} else if (process.argv[2] === '--tours') {
  Model = Tour;
} else if (process.argv[2] === '--reviews') {
  Model = Review;
} else {
  console.log('False');
  process.exit(0);
}

// select methods
if (process.argv[3] === '--import') {
  importData();
} else if (process.argv[3] === '--delete') {
  deleteData();
} else if (process.argv[3] === '--show') {
  showData();
}
