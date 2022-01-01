import { RESPONSE_STATUS, CustomResponse } from 'shared-types';
import * as Currencies from '../models/Currencies.model';

export const getAllCurrencies = async (req, res: CustomResponse, next) => {
  try {
    const data = await Currencies.getAllCurrencies();

    return res.status(200).json({
      status: RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    return next(new Error(err));
  }
};
