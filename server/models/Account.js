const mongoose = require('mongoose');

const { Schema } = mongoose;

const Account = new Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Account name is required'],
  },
  type: {
    type: Schema.Types.ObjectId,
    ref: 'AccountType',
  },
  currency: {
    type: Schema.Types.ObjectId,
    ref: 'Currency',
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Account', Account);
