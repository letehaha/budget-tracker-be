const Category = require('@models/Category');

exports.getCategories = async (req, res, next) => {
  try {
    const data = await Category.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
