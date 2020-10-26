const mongoose = require('mongoose');

const { Schema } = mongoose;

const Account = new Schema({
  name: String,
  type: {
    type: Schema.Types.ObjectId,
    ref: 'AccountType',
  },
  currency: {
    type: Schema.Types.ObjectId,
    ref: 'Currency',
  },
  currentBalance: Number,
});

module.exports = mongoose.model('Account', Account);
