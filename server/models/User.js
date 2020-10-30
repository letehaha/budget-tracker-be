const mongoose = require('mongoose');
const Transaction = require('./Transaction');
const Account = require('./Account');

const { Schema } = mongoose;

const User = new Schema({
  username: {
    type: String,
    trim: true,
    required: [true, 'Account name is required'],
  },
  email: {
    type: String,
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    trim: true,
    required: [true, 'Please enter your password'],
    minlength: [6, 'Password should be atleast minimum of 6 characters'],
    maxlength: [12, 'Password should be maximum of 12 characters'],
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/douy56nkf/image/upload/v1594060920/defaults/txxeacnh3vanuhsemfc8.png',
  },
  middleName: {
    type: String,
    trim: true,
  },
  transactions: [Transaction.schema],
  accounts: [Account.schema],
  totalBalance: {
    type: Number,
    default: 0,
  },
  // TODO: budgets, plannedPayments
});

module.exports = mongoose.model('User', User);
