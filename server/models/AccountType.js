const mongoose = require('mongoose');
const { Schema } = mongoose;

const AccountType = new Schema({
  name: {
    type: String,
    required: [true, 'Account type name is required']
  },
});

module.exports = mongoose.model('AccountType', AccountType);
