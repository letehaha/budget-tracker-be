import { PAYMENT_TYPES, TRANSACTION_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';
import { v4 as uuidv4 } from 'uuid';

import { logger} from '@js/utils/logger';
import { ValidationError } from '@js/errors';
import { connection } from '@models/index';
import * as Transactions from '@models/Transactions.model';
import * as UsersCurrencies from '@models/UsersCurrencies.model';
import * as userExchangeRateService from '@services/user-exchange-rate';
import * as Accounts from '@models/Accounts.model';

import { getTransactionById } from './get-by-id';

interface UpdateParams {
  id: number;
  authorId: number;
  amount?: number;
  note?: string;
  time?: Date;
  transactionType?: TRANSACTION_TYPES;
  paymentType?: PAYMENT_TYPES;
  accountId?: number;
  categoryId?: number;
  isTransfer?: boolean;
}

interface UpdateTransferParams {
  destinationAmount?: number;
  destinationAccountId?: number;
  isTransfer?: boolean;
}

/**
 * Updates transaction and updates account balance.
 */
 export const updateTransaction = async ({
  id,
  authorId,
  amount,
  destinationAmount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  isTransfer = false,
  destinationAccountId,
}: UpdateParams & UpdateTransferParams) => {
  let transaction: Transaction = null;

  try {
    transaction = await connection.sequelize.transaction();

    const {
      amount: previousAmount,
      refAmount: previousRefAmount,
      accountId: previousAccountId,
      isTransfer: previouslyItWasTransfer,
      currencyCode: previousCurrencyCode,
      transferId,
    } = await getTransactionById(
      { id, authorId },
      { transaction },
    );

    const { currency: defaultUserCurrency } = await UsersCurrencies.getCurrency(
      { userId: authorId, isDefaultCurrency: true },
      { transaction }
    );

    if (isTransfer && transactionType !== TRANSACTION_TYPES.expense) {
      throw new ValidationError({ message: 'You cannot edit non-primary transfer transaction' });
    }

    const updatedTransactions = []

    const isBaseTxAccountChanged = accountId && accountId !== previousAccountId

    const baseTransactionUpdateParams: Transactions.UpdateTransactionByIdParams = {
      id,
      amount: amount ?? previousAmount,
      refAmount: amount ?? previousRefAmount,
      note,
      time,
      authorId,
      // When transfer, base tx can only be "expense'
      transactionType: isTransfer ? TRANSACTION_TYPES.expense : transactionType,
      paymentType,
      accountId,
      categoryId,
      isTransfer,
      currencyCode: previousCurrencyCode,
    }

    if (isBaseTxAccountChanged) {
      // Since accountId is changed, we need to change currency too
      const { currency: baseTxCurrency } = await Accounts.getAccountCurrency({
        userId: authorId,
        id: accountId,
      });

      baseTransactionUpdateParams.currencyId = baseTxCurrency.id
      baseTransactionUpdateParams.currencyCode = baseTxCurrency.code
    }

    if (
      defaultUserCurrency.code !== baseTransactionUpdateParams.currencyCode &&
      baseTransactionUpdateParams.amount !== previousAmount
    ) {
      const { rate } = await userExchangeRateService.getExchangeRate({
        userId: authorId,
        baseCode: baseTransactionUpdateParams.currencyCode,
        quoteCode: defaultUserCurrency.code,
      }, { transaction })

      baseTransactionUpdateParams.refAmount = Math.max(
        Math.floor(baseTransactionUpdateParams.amount * rate),
        1,
      )
    }

    const baseTransaction = await Transactions.updateTransactionById(
      baseTransactionUpdateParams,
      { transaction },
    );

    updatedTransactions.push(baseTransaction)

    if (isTransfer) {
      if (previouslyItWasTransfer) {
        // If previously the base tx was transfer, we need to:
        // 1. Find opposite tx to get access to old tx data
        // 2. Update opposite tx data

        const notBaseTransaction = (await Transactions.getTransactionsByArrayOfField({
          fieldValues: [transferId],
          fieldName: 'transferId',
          authorId,
        })).find(item => Number(item.id) !== Number(id));

        const destinationTransaction = await Transactions.updateTransactionById(
          {
            id: notBaseTransaction.id,
            authorId,
            amount: destinationAmount,
            refAmount: baseTransactionUpdateParams.refAmount,
            note,
            time,
            transactionType: TRANSACTION_TYPES.income,
            paymentType: paymentType,
            accountId: destinationAccountId,
            categoryId,
          },
          { transaction },
        );

        // If accountId was changed to a new one
        if (destinationAccountId && destinationAccountId !== notBaseTransaction.accountId) {
          // Since accountId is changed, we need to change currency too
          const { currency: oppositeTxCurrency } = await Accounts.getAccountCurrency({
            userId: authorId,
            id: accountId,
          });
          await Transactions.updateTransactionById(
            {
              id: notBaseTransaction.id,
              authorId,
              currencyId: oppositeTxCurrency.id,
              currencyCode: oppositeTxCurrency.code,
            },
            { transaction },
          );
        }

        updatedTransactions.push(destinationTransaction)
      } else {
        // If previously the base tx wasn't transfer, so it was income or expense,
        // we need to:
        // 1. create an opposite tx
        // 2. generate "transferId" and put it to both transactions

        if (!destinationAmount || !destinationAccountId) {
          throw new ValidationError({
            message: `One of required fields are missing: destinationAmount, destinationAccountId.`,
          })
        }

        const transferId = uuidv4();

        await Transactions.updateTransactionById({
          id: baseTransaction.id,
          authorId: baseTransaction.authorId,
          transferId,
          isTransfer: true,
        }, { transaction });

        const { currency: oppositeTxCurrency } = await Accounts.getAccountCurrency({
          userId: authorId,
          id: destinationAccountId,
        });

        const createdTx = await Transactions.createTransaction(
          {
            authorId: baseTransaction.authorId,
            amount: destinationAmount,
            refAmount: destinationAmount,
            note: baseTransaction.note,
            time: new Date(baseTransaction.time),
            // opposite tx can only be income
            transactionType: TRANSACTION_TYPES.income,
            paymentType: baseTransaction.paymentType,
            accountId: destinationAccountId,
            categoryId: baseTransaction.categoryId,
            accountType: baseTransaction.accountType,
            currencyId: oppositeTxCurrency.id,
            currencyCode: oppositeTxCurrency.code,
            isTransfer: true,
            transferId,
          },
          { transaction },
        );

        updatedTransactions.push(createdTx);
      }
    } else if (!isTransfer && previouslyItWasTransfer) {
      // If right now base tx is not transfer, but previously it was one, we need
      // to:
      // 1. remove old opposite tx
      // 2. remove "trasferId" from base tx

      const notBaseTransaction = (await Transactions.getTransactionsByArrayOfField({
        fieldValues: [transferId],
        fieldName: 'transferId',
        authorId,
      })).find(item => Number(item.id) !== Number(id));

      await Transactions.deleteTransactionById({
        id: notBaseTransaction.id,
        authorId: notBaseTransaction.authorId
      }, { transaction });

      await Transactions.updateTransactionById(
        {
          id: baseTransaction.id,
          authorId: baseTransaction.authorId,
          transferId: null,
          isTransfer: false,
        },
        { transaction },
      );
    }

    await transaction.commit();

    return updatedTransactions;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    await transaction.rollback();
    throw e;
  }
};
