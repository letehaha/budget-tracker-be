const mongoose = require('mongoose');
const User = require('@models/User');

const { ObjectId } = mongoose.Types;
const validateObjectId = (id) => ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;

exports.getUsers = async (req, res, next) => {
  try {
    const data = await User.find();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: 'User "id" is invalid',
      });
    }

    const data = await User.findById(id);

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.createUser = async (req, res, next) => {
  const {
    username,
    firstName,
    lastName,
    middleName,
    password,
    avatar,
    transactions,
    accounts,
    totalBalance,
    email,
  } = req.body;

  try {
    const data = await new User({
      username,
      firstName,
      lastName,
      middleName,
      password,
      avatar,
      transactions,
      accounts,
      totalBalance,
      email,
    }).save();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
  const {
    email,
    username,
    firstName,
    lastName,
    middleName,
    password,
    avatar,
    totalBalance,
  } = req.body;

  try {
    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: 'User id is invalid',
      });
    }

    const userRecord = await User.findById(id);
    if (!userRecord) {
      return res.status(404).json({
        message: `No User found with such id "${id}"`,
      });
    }

    const query = { _id: userRecord._id };
    const update = {
      ...email !== undefined && { email },
      ...username !== undefined && { username },
      ...firstName !== undefined && { firstName },
      ...lastName !== undefined && { lastName },
      ...middleName !== undefined && { middleName },
      ...password !== undefined && { password },
      ...avatar !== undefined && { avatar },
      ...totalBalance !== undefined && { totalBalance },
    };
    await User.updateOne(query, update);

    const data = await User.findById(query._id);

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!validateObjectId(id)) {
      return res.status(400).json({
        message: 'User id is invalid',
      });
    }

    const userRecord = await User.findById(id);
    if (!userRecord) {
      return res.status(404).json({
        message: `No User found with such id "${id}"`,
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({ response: {} });
  } catch (err) {
    return next(new Error(err));
  }
};
