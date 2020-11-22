const { Users } = require('@models');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await Users.getUsers();

    return res.status(200).json({ response: users });
  } catch (err) {
    return next(new Error(err));
  }
};
