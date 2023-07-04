import { CustomResponse, RESPONSE_STATUS } from '@common/types';
import { validationResult } from 'express-validator/check';

export default (req, res: CustomResponse, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const resultErrors = errors.array().map((item) => ({
      param: item.param,
      msg: item.msg,
    }));

    return res.status(422).json({
      status: RESPONSE_STATUS.error,
      response: {
        errors: resultErrors,
      },
    });
  }
  return next();
};
