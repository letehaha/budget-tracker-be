import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { recordId } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups/account-groups.service';

export const deleteAccountGroup = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const { groupId }: DeleteAccountGroupParams['params'] = req.validated.params;

    const deletedCount = await accountGroupService.deleteAccountGroup({
      groupId,
      userId,
    });

    if (deletedCount === 0) {
      return res.status(404).json({ status: API_RESPONSE_STATUS.error });
    }

    return res.status(204).send();
  } catch (err) {
    errorHandler(res, err);
  }
};

export const deleteAccountGroupSchema = z.object({
  params: z.object({ groupId: recordId() }),
});

type DeleteAccountGroupParams = z.infer<typeof deleteAccountGroupSchema>;
