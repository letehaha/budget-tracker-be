import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as accountsService from '@services/accounts';
import { errorHandler } from '@controllers/helpers';

export const getAccountById = async (req, res: CustomResponse) => {
  const { id }: GetAccountByIdParams = req.validated.params;
  const { id: userId } = req.user;

  try {
    const account = await accountsService.getAccountById({ userId, id });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const recordId = () => z.number().int().positive().finite();
const paramsSchema = z.object({
  id: z.preprocess((val) => Number(val), recordId()),
});

export const getAccountByIdSchema = z.object({
  params: paramsSchema,
});

type GetAccountByIdParams = z.infer<typeof paramsSchema>;
