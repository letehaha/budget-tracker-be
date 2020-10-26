const mongoose = require('mongoose');

const { Schema } = mongoose;

const Currency = new Schema({
  currency: {
    type: String,
    required: [true, 'Currency: currency is required'],
  },
  digits: {
    type: Number,
    default: 2,
  },
  number: {
    type: Number,
    required: [true, 'Currency: number is required'],
  },
  code: {
    type: String,
    required: [true, 'Currency: code is required'],
  },
  countries: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model('Currency', Currency);
