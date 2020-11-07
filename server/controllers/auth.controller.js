const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Users } = require('@models');

exports.login = async (req, res, next) => {
  const {
    username,
    password,
  } = req.body;

  try {
    const user = await Users.getUserByCredentials({ username });
    if (user) {
      const isPasswordValid = bcrypt.compareSync(password, user.get('password'));

      if (isPasswordValid) {
        const token = jwt.sign(
          {
            username: user.get('username'),
            userId: user.get('id'),
          },
          config.get('jwtSecret'),
          {
            expiresIn: 60 * 60, // 1 hour
          },
        );

        return res
          .status(200)
          .json({ response: { token: `Bearer ${token}` } });
      }

      return res
        .status(401)
        .json({ message: 'User email and/or password are invalid!' });
    }

    return res
      .status(404)
      .json({ message: 'User not found!' });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.register = async (req, res, next) => {
  const {
    username,
    password,
  } = req.body;

  try {
    let user = await Users.getUserByCredentials({ username });
    if (user) {
      return res
        .status(409)
        .json({ message: 'User already exist!' });
    }

    const salt = bcrypt.genSaltSync(10);

    user = await Users.createUser({
      username,
      password: bcrypt.hashSync(password, salt),
    });

    return res
      .status(201)
      .json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};
