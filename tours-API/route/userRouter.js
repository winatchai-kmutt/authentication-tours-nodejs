const express = require('express');

const router = express.Router();

const userController = require('./../controller/userController');
const authController = require('./../controller/authController');

router.post('/signup', authController.singnUp);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.get('/me', userController.getMe, userController.getUser);
router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateUser', authController.updateUser);
router.delete('/deleteUser/:id', authController.deleteUser);

router
  .route('/')
  .get(
    authController.restrictTo('admin', 'leadguid'),
    userController.getAllUser
  )
  .post(userController.createUser);
router.get('/:id', userController.getUser);

module.exports = router;
