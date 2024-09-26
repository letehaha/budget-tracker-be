import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as accountsService from '@services/accounts';
import { errorHandler } from '@controllers/helpers';

export const getAccounts = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;

  try {
    const accounts = await accountsService.getAccounts({ userId });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: accounts,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
