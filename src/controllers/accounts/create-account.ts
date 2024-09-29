import { z } from 'zod';
import { ACCOUNT_CATEGORIES, ACCOUNT_TYPES, API_RESPONSE_STATUS } from 'shared-types';
import * as accountsService from '@services/accounts';
import { Unauthorized } from '@js/errors';
import { errorHandler } from '@controllers/helpers';

export const createAccount = async (req, res) => {
  const {
    accountCategory = ACCOUNT_CATEGORIES.general,
    currencyId,
    name,
    type = ACCOUNT_TYPES.system,
    initialBalance,
    creditLimit,
  }: CreateAccountParams = req.validated.body;
  const { id: userId } = req.user;

  try {
    if (type !== ACCOUNT_TYPES.system && process.env.NODE_ENV === 'production') {
      throw new Unauthorized({
        message: `Only "type: ${ACCOUNT_TYPES.system}" is allowed.`,
      });
    }

    const account = await accountsService.createAccount({
      accountCategory,
      currencyId,
      name,
      type,
      creditLimit,
      initialBalance,
      userId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const recordId = () => z.number().int().positive().finite();

const bodySchema = z.object({
  accountCategory: z.nativeEnum(ACCOUNT_CATEGORIES).default(ACCOUNT_CATEGORIES.general),
  currencyId: recordId(),
  name: z.string().max(255),
  type: z.nativeEnum(ACCOUNT_TYPES).default(ACCOUNT_TYPES.system),
  initialBalance: z
    .preprocess((val) => Number(val), z.number().int().nonnegative())
    .optional()
    .default(0),
  creditLimit: z
    .preprocess((val) => Number(val), z.number().int().nonnegative())
    .optional()
    .default(0),
});

export const createAccountSchema = z.object({
  body: bodySchema,
});

type CreateAccountParams = z.infer<typeof bodySchema>;
