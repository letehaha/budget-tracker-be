import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { recordId } from '@common/lib/zod/custom-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups/account-groups.service';

export const createAccountGroup = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const { name, parentGroupId }: CreateAccountGroupParams['body'] = req.validated.body;

    const group = await accountGroupService.createAccountGroup({ userId, name, parentGroupId });

    return res.status(201).json({
      status: API_RESPONSE_STATUS.success,
      response: group,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const createAccountGroupSchema = z.object({
  body: z
    .object({
      name: z.string().min(1),
      parentGroupId: recordId().nullable().optional(),
    })
    .strict(),
});

type CreateAccountGroupParams = z.infer<typeof createAccountGroupSchema>;
