import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import * as accountsService from '@services/accounts';
import { errorHandler } from '@controllers/helpers';

export const deleteAccount = async (req, res) => {
  const { id }: DeleteParams = req.params;

  try {
    await accountsService.deleteAccountById({ id });

    return res.status(200).json({ status: API_RESPONSE_STATUS.success });
  } catch (err) {
    errorHandler(res, err);
  }
};

const recordId = () => z.number().int().positive().finite();
const paramsSchema = z.object({
  id: z.preprocess((val) => Number(val), recordId()),
});

export const deleteAccountSchema = z.object({
  params: paramsSchema,
});

type DeleteParams = z.infer<typeof paramsSchema>;
