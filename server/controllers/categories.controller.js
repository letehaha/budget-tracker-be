const { Categories } = require('@models');

exports.getCategories = async (req, res, next) => {
  try {
    const data = await Categories.getCategories();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
