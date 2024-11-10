import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import type { CustomResponse } from '@common/types';
import { recordId } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups';

export const removeAccountFromGroup = async (req, res: CustomResponse) => {
  try {
    const { accountId, groupId }: RemoveAccountFromGroupParams['params'] = req.validated.params;

    await accountGroupService.removeAccountFromGroup({
      accountId,
      groupId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const removeAccountFromGroupSchema = z.object({
  params: z.object({
    accountId: recordId(),
    groupId: recordId(),
  }),
});

type RemoveAccountFromGroupParams = z.infer<typeof removeAccountFromGroupSchema>;
