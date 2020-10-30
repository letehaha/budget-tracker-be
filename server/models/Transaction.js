const mongoose = require('mongoose');

const { Schema } = mongoose;

const Transaction = new Schema(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: [true, 'Transaction account is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Transaction category is required'],
    },
    note: {
      type: String,
    },
    paymentType: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentType',
      required: [true, 'Transaction paymentType is required'],
    },
    time: {
      type: Date,
      required: [true, 'Transaction time is required'],
    },
    type: {
      type: Schema.Types.ObjectId,
      ref: 'TransactionType',
      required: [true, 'Transaction type is required'],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Transaction', Transaction);
