import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'

import { Transaction } from 'sequelize/types';
import { v4 as uuidv4 } from 'uuid';

import { connection } from '@models/index';
import { logger} from '@js/utils/logger';

import * as Transactions from '@models/Transactions.model';

import { updateAccountBalance } from './helpers';

interface CreateTransaction {
  authorId: number;
  amount: number;
  note?: string;
  time: string;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  accountId: number;
  categoryId: number;
  accountType: ACCOUNT_TYPES;
  currencyId: number;
  currencyCode: string;
  isTransfer;
}

interface CreateTransferTransaction {
  destinationAmount?: number;
  destinationAccountId?: number;
  destinationCurrencyId?: number;
  destinationCurrencyCode?: string;
}

/**
 * Creates transaction and updates account balance.
 */
 export const createTransaction = async ({
  authorId,
  amount,
  note,
  time,
  transactionType,
  paymentType,
  accountId,
  categoryId,
  accountType,
  currencyId,
  currencyCode,
  destinationCurrencyId,
  destinationCurrencyCode,
  isTransfer = false,
  destinationAmount,
  destinationAccountId,
  // TODO:
  // destinationCurrencyCode
}: CreateTransaction & CreateTransferTransaction) => {
  let transaction: Transaction = null;

  transaction = await connection.sequelize.transaction();

  try {
    const generalTxParams = {
      amount,
      refAmount: amount,
      note,
      time,
      authorId,
      transactionType,
      paymentType,
      accountId,
      categoryId,
      accountType,
      currencyId,
      currencyCode,
      isTransfer,
      transferId: undefined,
    };

    let mainTxParams = { ...generalTxParams }
    let transactionsParams = [mainTxParams]

    /**
     * If transactions is transfer, add transferId to both transactions to connect
     * them, and use destinationAmount and destinationAccountId for the second
     * transaction.
     */
    if (isTransfer) {
      const transferId = uuidv4();

      mainTxParams = {
        ...mainTxParams,
        transferId,
        transactionType: TRANSACTION_TYPES.expense,
      }

      const destinationTxParams = {
        ...generalTxParams,
        amount: destinationAmount,
        accountId: destinationAccountId,
        transferId,
        transactionType: TRANSACTION_TYPES.income,
        currencyId: destinationCurrencyId,
        currencyCode: destinationCurrencyCode,
      }

      transactionsParams = [mainTxParams, destinationTxParams]
    }

    const transactions = await Promise.all(
      transactionsParams.map(params => (
        Transactions.createTransaction(
          params,
          { transaction },
        )
      ))
    )

    await Promise.all(
      transactions.map(tx => (
        updateAccountBalance(
          {
            accountId: tx.accountId,
            userId: tx.authorId,
            amount: tx.transactionType === TRANSACTION_TYPES.income
              ? tx.amount
              : tx.amount * -1,
          },
          { transaction },
        )
      ))
    )

    await transaction.commit();

    return transactions;
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e);
    }
    await transaction.rollback();
    throw e;
  }
};

const exampleRecord = {
  "paymentType": 2,
  "refAmount": 3724632,
  "amount": 100800,
  "decimalRefAmount": "37246.31891453089880691084",
  "currencyId": "-Currency_1391ee23-bdf9-426d-ab8a-b4b7eb110433",
  "reservedCreatedAt": "2022-08-30T16:52:36.791Z",
  "reservedModelType": "Record",
  "recordState": 1,
  "decimalAmount": "1008",
  "reservedUpdatedAt": "Tue Aug 30 2022 19:52:36 GMT+0300 (Eastern European Summer Time)",
  "reservedSource": "ios",
  "type": 0,
  "reservedAuthorId": "ab384693-5a5b-4126-a8b2-d470cc935ac1",
  "transferId": "05D71274-6390-468A-BAB9-455AEB657F05",
  "photos": "[]",
  "categoryChanged": false,
  "recordDate": "Tue Aug 30 2022 19:52:19 GMT+0300 (Eastern European Summer Time)",
  "reservedOwnerId": "ab384693-5a5b-4126-a8b2-d470cc935ac1",
  "accountId": "-Account_99158b03-fd1c-418e-ba69-f71070b82b4a",
  "categoryId": "-Category_5edc68f7-42f3-407a-b2cf-89c0e0add31a",
  "_id": "Record_e8e161db-2d42-415d-8402-537608be2324",
  "_rev": "1-573137752d0a1573171e028d52916999",
  "recordDateMonth": "Mon Aug 01 2022 00:00:00 GMT+0300 (Eastern European Summer Time)",
  "recordDateWeek": "Sun Aug 28 2022 00:00:00 GMT+0300 (Eastern European Summer Time)",
  "recordDateDay": "Tue Aug 30 2022 00:00:00 GMT+0300 (Eastern European Summer Time)",
  "accuracy": 0,
  "warrantyInMonth": 0,
  "transfer": true,
  "envelopeId": 20001,
  "superEnvelopeId": 200,
  "labelsView": "[]",
  "fulltextString": null,
  "categoryName": "Transfer, withdraw",
  "categoryIcon": "category-icon category-icon-sorting-arrows-horizontal-filled",
  "color": "#8BC34A",
  "accountName": "Interactive Brokers",
  "accountColor": "#d32f2f",
  "currencyCode": "USD",
  "accountIsConnected": false,
  "referentialCurrencyCode": "UAH",
  "note": ""
};
