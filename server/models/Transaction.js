const mongoose = require('mongoose');

const { Schema } = mongoose;

const Transaction = new Schema({
  account: {
    type: mongoose.ObjectId,
    required: [true, 'Transaction account is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
  },
  category: {
    type: mongoose.ObjectId,
    required: [true, 'Transaction category is required'],
  },
  note: {
    type: String,
  },
  paymentType: {
    type: mongoose.ObjectId,
    required: [true, 'Transaction paymentType is required'],
  },
  time: {
    type: Date,
    required: [true, 'Transaction time is required'],
  },
  type: {
    type: mongoose.ObjectId,
    required: [true, 'Transaction type is required'],
  },
});

module.exports = mongoose.model('Transaction', Transaction);
