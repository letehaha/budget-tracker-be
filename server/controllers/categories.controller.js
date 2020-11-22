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

exports.createCategory = async (req, res, next) => {
  const { id } = req.user;
  const {
    name,
    imageUrl,
    color,
    type,
    parentId,
  } = req.body;

  try {
    const data = await Categories.createCategory({
      name,
      imageUrl,
      color,
      type,
      parentId,
      userId: id,
    });

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
