import { z } from 'zod';
import {
  ACCOUNT_TYPES,
  API_RESPONSE_STATUS,
  PAYMENT_TYPES,
  TRANSACTION_TRANSFER_NATURE,
  TRANSACTION_TYPES,
} from 'shared-types';
import { CustomRequest, CustomResponse } from '@common/types';
import { errorHandler } from '@controllers/helpers';

import * as transactionsService from '@services/transactions';

export const createTransaction = async (
  req: CustomRequest<typeof createTransactionSchema>,
  res: CustomResponse,
) => {
  try {
    const {
      amount,
      destinationAmount,
      destinationTransactionId,
      note,
      time,
      transactionType,
      paymentType,
      accountId,
      destinationAccountId,
      categoryId,
      accountType = ACCOUNT_TYPES.system,
      transferNature = TRANSACTION_TRANSFER_NATURE.not_transfer,
      refundsTxId,
    } = req.validated.body;
    const { id: userId } = req.user;

    const params = {
      amount,
      destinationTransactionId,
      destinationAmount,
      note,
      time: new Date(time),
      transactionType,
      paymentType,
      accountId,
      destinationAccountId,
      categoryId,
      accountType,
      transferNature,
      userId,
      refundsTxId,
    };

    // TODO: Add validations
    // 1. Amount and destinationAmount with same currency should be equal
    // 2. That transactions here might be created only with system account type

    let data = await transactionsService.createTransaction(params);

    if (data[0].dataValues) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data = data.map((d) => d.dataValues ?? d) as any;
    }

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const recordId = () => z.number().int().positive().finite();
const bodyZodSchema = z
  .object({
    amount: z.number().int().positive('Amount must be greater than 0').finite(),
    note: z.string().max(1000, 'The string must not exceed 1000 characters.').nullish(),
    time: z.string().datetime({ message: 'Invalid ISO date string' }).optional(),
    transactionType: z.nativeEnum(TRANSACTION_TYPES),
    paymentType: z.nativeEnum(PAYMENT_TYPES),
    accountId: recordId(),
    accountType: z.nativeEnum(ACCOUNT_TYPES).optional(),
    destinationAmount: z
      .number()
      .int()
      .positive('Amount must be greater than 0')
      .finite()
      .optional(),
    destinationAccountId: recordId().optional(),
    destinationTransactionId: recordId().optional(),
    categoryId: recordId(),
    transferNature: z.nativeEnum(TRANSACTION_TRANSFER_NATURE),
    refundsTxId: recordId().optional(),
  })
  .refine(
    (data) =>
      !(
        data.transferNature &&
        data.transferNature !== TRANSACTION_TRANSFER_NATURE.not_transfer &&
        data.refundsTxId
      ),
    {
      message: `Non-${TRANSACTION_TRANSFER_NATURE.not_transfer} cannot be used in "transferNature" when "refundsTxId" is used`,
      path: ['transferNature', 'refundsTxId'],
    },
  )
  .refine(
    (data) => {
      if (data.transferNature === TRANSACTION_TRANSFER_NATURE.transfer_out_wallet) {
        return !(data.accountId && data.destinationAccountId);
      }
      return true;
    },
    {
      message: `"accountId" and "destinationAccountId" cannot be used both when "${TRANSACTION_TRANSFER_NATURE.transfer_out_wallet}" is provided`,
      path: ['accountId', 'destinationAccountId'],
    },
  )
  .refine(
    (data) => {
      if (
        data.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer &&
        data.destinationTransactionId
      ) {
        return !(data.destinationAccountId || data.destinationAmount);
      }
      return true;
    },
    {
      message: `When "destinationTransactionId" is provided for ${TRANSACTION_TRANSFER_NATURE.common_transfer}, other fields should not be present`,
      path: ['destinationAccountId', 'destinationAmount', 'destinationTransactionId'],
    },
  )
  .refine(
    (data) => {
      if (
        data.transferNature === TRANSACTION_TRANSFER_NATURE.common_transfer &&
        !data.destinationTransactionId
      ) {
        return !!(data.destinationAccountId && data.destinationAmount);
      }
      return true;
    },
    {
      message: `For ${TRANSACTION_TRANSFER_NATURE.common_transfer} without "destinationTransactionId" - "destinationAccountId", and "destinationAmount" must be provided`,
      path: ['destinationAccountId', 'destinationAmount', 'destinationTransactionId'],
    },
  );

export const createTransactionSchema = z.object({
  body: bodyZodSchema,
});
