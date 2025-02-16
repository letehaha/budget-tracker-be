import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { recordId } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups';
import { API_RESPONSE_STATUS } from 'shared-types';

export const deleteAccountGroup = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const { groupId }: DeleteAccountGroupParams['params'] = req.validated.params;

    await accountGroupService.deleteAccountGroup({
      groupId,
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const deleteAccountGroupSchema = z.object({
  params: z.object({ groupId: recordId() }),
});

type DeleteAccountGroupParams = z.infer<typeof deleteAccountGroupSchema>;
