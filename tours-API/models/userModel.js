const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your email.']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide valid email.'
    }
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  photo: {
    type: String,
    required: [true, 'The data user must have a photo.']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      validator: function(value) {
        return value === this.password;
      },
      message: 'Password are not the true.'
    }
  },
  passwordChangeAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', function(next) {
  // for modified password
  if (!this.isModified('password')) {
    return next();
  }

  // password convert to crtypted
  this.password = bcrypt.hashSync(this.password, 12);

  // Deleted passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = function(passNonEncrypt, passEncrtyped) {
  return bcrypt.compareSync(passNonEncrypt, passEncrtyped);
};

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.changePasswordAfterToken = function(tokenStamp) {
  if (this.passwordChangeAt) {
    const passwordChangeAtTime = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );
    return tokenStamp < passwordChangeAtTime;
  }
  return false;
};

userSchema.methods.createPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
