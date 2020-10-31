const mongoose = require('mongoose');

const { Schema } = mongoose;

const Category = new Schema();
Category.add({
  name: {
    type: String,
    required: [true, 'Category name is required'],
  },
  parentId: {
    type: Schema.Types.ObjectId,
    default: null,
  },
});

module.exports = mongoose.model('Category', Category);
