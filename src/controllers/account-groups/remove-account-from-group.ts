import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import type { CustomResponse } from '@common/types';
import { recordId, recordArrayIds } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups';

export const removeAccountFromGroup = async (req, res: CustomResponse) => {
  try {
    const { groupId }: RemoveAccountFromGroupParams['params'] = req.validated.params;
    const { accountIds }: RemoveAccountFromGroupParams['body'] = req.validated.body;

    await accountGroupService.removeAccountFromGroup({
      accountIds,
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
    groupId: recordId(),
  }),
  body: z.object({
    accountIds: recordArrayIds(),
  })
});

type RemoveAccountFromGroupParams = z.infer<typeof removeAccountFromGroupSchema>;
