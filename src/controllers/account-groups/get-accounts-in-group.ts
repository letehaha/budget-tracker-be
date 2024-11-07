import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { recordId } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups/account-groups.service';

export const getAccountsInGroup = async (req, res: CustomResponse) => {
  try {
    const { groupId }: GetAccountsInGroupParams['params'] = req.validated.params;

    const accounts = await accountGroupService.getAccountsInGroup({
      groupId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: accounts,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const getAccountsInGroupSchema = z.object({
  params: z.object({ groupId: recordId() }),
});

type GetAccountsInGroupParams = z.infer<typeof getAccountsInGroupSchema>;
