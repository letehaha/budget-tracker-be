import * as AccountTypes from '../models/AccountTypes.model';

export const getAccountTypes = async (req, res, next) => {
  try {
    const data = await AccountTypes.getAccountTypes();

    return res.status(200).json({ response: data });
  } catch (err) {
    return next(new Error(err));
  }
};
