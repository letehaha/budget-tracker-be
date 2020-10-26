const mongoose = require('mongoose');

const { Schema } = mongoose;

const TransactionType = new Schema({
  name: {
    type: String,
    required: [true, 'TransactionType name is require'],
  },
  type: {
    type: String,
    required: [true, 'TransactionType type is require'],
  },
});

module.exports = mongoose.model('TransactionType', TransactionType);
