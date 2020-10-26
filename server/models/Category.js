const mongoose = require('mongoose');
const { Schema } = mongoose;

const Category = new Schema();
Category.add({
  name: {
    type: String,
    required: [true, 'Category name is required'],
  },
  subcategories: [Category],
})

module.exports = mongoose.model('Category', Category);
