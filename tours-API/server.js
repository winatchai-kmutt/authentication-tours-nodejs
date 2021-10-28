const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log('uncaughtException 🥵', err.name);
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD
);
const PORT = process.env.PORT || 5000;

mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('DB connected');
  });

// server run
const app = require('./app');

const server = app.listen(PORT, () => {
  console.log(`server run on PORT ${PORT}`);
});

process.on('unhandledRejection', err => {
  console.log('unhandledRejection 🥶', err.name);
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
