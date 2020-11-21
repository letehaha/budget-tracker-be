const { Categories } = require('@models');

exports.getCategories = async (req, res, next) => {
  const { id } = req.user;

  try {
    const data = await Categories.getCategories({ id });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
