import { z } from 'zod';
import type { CustomResponse } from '@common/types';
import { commaSeparatedRecordIds } from '@common/lib/zod/custom-types';
import { API_RESPONSE_STATUS } from 'shared-types';
import { errorHandler } from '@controllers/helpers';
import * as accountGroupService from '@services/account-groups';

export const getAccountGroups = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const { accountIds }: GetAccountGroupsParams['query'] = req.validated.query;

    const groups = await accountGroupService.getAccountGroups({ userId, accountIds });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: groups,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const getAccountGroupsSchema = z.object({
  query: z.object({ accountIds: commaSeparatedRecordIds.optional() }),
});

type GetAccountGroupsParams = z.infer<typeof getAccountGroupsSchema>;
