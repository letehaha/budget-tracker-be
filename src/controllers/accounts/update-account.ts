import { z } from 'zod';
import { ACCOUNT_CATEGORIES, ACCOUNT_TYPES, API_RESPONSE_STATUS } from 'shared-types';
import * as accountsService from '@services/accounts';
import { removeUndefinedKeys } from '@js/helpers';
import Accounts from '@models/Accounts.model';
import { ValidationError, NotFoundError } from '@js/errors';
import { errorHandler } from '@controllers/helpers';

export const updateAccount = async (req, res) => {
  const { id }: UpdateAccountParams = req.params;
  const { id: userId } = req.user;
  const { accountCategory, name, creditLimit, isEnabled, currentBalance }: UpdateAccountBody =
    req.body;

  try {
    const account = await Accounts.findByPk(id);

    if (!account) {
      throw new NotFoundError({
        message: `Account with id "${id}" doesn't exist.`,
      });
    }

    if (account.type !== ACCOUNT_TYPES.system) {
      if (creditLimit || currentBalance) {
        throw new ValidationError({
          message: `'creditLimit', 'currentBalance' are only allowed to be changed for "${ACCOUNT_TYPES.system}" account type`,
        });
      }
    }

    // If user wants to change currentBalance, he can do it in two ways:
    // 1. Create an adjustment transaction
    // 2. Update `currentBalance` field, which will automatically edit initialBalance and balance history
    const result = await accountsService.updateAccount({
      id,
      userId,
      ...removeUndefinedKeys({
        isEnabled,
        accountCategory,
        currentBalance: Number(currentBalance),
        name,
        creditLimit: Number(creditLimit),
      }),
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const recordId = () => z.number().int().positive().finite();

const paramsSchema = z.object({
  id: z.preprocess((val) => Number(val), recordId()),
});

const bodySchema = z.object({
  accountCategory: z.nativeEnum(ACCOUNT_CATEGORIES).optional(),
  name: z.string().max(255).optional(),
  creditLimit: z.preprocess((val) => Number(val), z.number().int().nonnegative()).optional(),
  currentBalance: z.preprocess((val) => Number(val), z.number().int()).optional(),
  isEnabled: z.preprocess((val) => val === 'true', z.boolean()).optional(),
});

export const updateAccountSchema = z.object({
  params: paramsSchema,
  body: bodySchema,
});

type UpdateAccountParams = z.infer<typeof paramsSchema>;
type UpdateAccountBody = z.infer<typeof bodySchema>;
