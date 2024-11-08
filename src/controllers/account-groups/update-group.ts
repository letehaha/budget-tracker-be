import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { recordId } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups';

export const updateAccountGroup = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const { groupId }: UpdateAccountGroupParams['params'] = req.validated.params;
    const updates: UpdateAccountGroupParams['body'] = req.validated.body;

    const updatedGroups = await accountGroupService.updateAccountGroup({
      groupId,
      userId,
      ...updates,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: updatedGroups,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const updateAccountGroupSchema = z.object({
  params: z.object({ groupId: recordId() }),
  body: z
    .object({
      name: z.string().min(1),
      parentGroupId: recordId().nullable().optional(),
    })
    .strict()
    .partial(),
});

type UpdateAccountGroupParams = z.infer<typeof updateAccountGroupSchema>;
