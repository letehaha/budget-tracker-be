const { validationResult } = require('express-validator/check');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const resultErrors = errors.array().map(item => ({
      param: item.param,
      msg: item.msg,
    }));

    return res.status(422).json({ errors: resultErrors });
  }
  return next();
};
