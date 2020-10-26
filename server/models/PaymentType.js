const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentType = new Schema({
  name: {
    type: String,
    required: [true, 'Payment type name is required']
  },
});

module.exports = mongoose.model('PaymentType', PaymentType);
