import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import { validationResult } from 'express-validator';

export default (req, res: CustomResponse, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const resultErrors = errors.array().map((item) => ({
      param: item.type,
      msg: item.msg,
    }));

    return res.status(422).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        errors: resultErrors,
      },
    });
  }
  return next();
};
