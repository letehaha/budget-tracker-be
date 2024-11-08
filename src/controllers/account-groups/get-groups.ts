import type { CustomResponse } from '@common/types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups';

export const getAccountGroups = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;

    const groups = await accountGroupService.getAccountGroups({ userId });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: groups,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
