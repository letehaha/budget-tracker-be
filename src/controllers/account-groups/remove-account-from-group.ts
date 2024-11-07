import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { recordId } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups/account-groups.service';

export const removeAccountFromGroup = async (req, res: CustomResponse) => {
  try {
    const { accountId, groupId }: RemoveAccountFromGroupParams['params'] = req.validated.params;

    const removedCount = await accountGroupService.removeAccountFromGroup({
      accountId,
      groupId,
    });

    if (removedCount === 0) {
      return res.status(404).json({ status: API_RESPONSE_STATUS.error });
    }

    return res.status(204).send();
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
