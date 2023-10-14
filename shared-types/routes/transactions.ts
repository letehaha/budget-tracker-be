import { TransactionModel, ACCOUNT_TYPES, SORT_DIRECTIONS, TRANSACTION_TYPES } from 'shared-types';
import { BodyPayload, QueryPayload } from './index';

export interface GetTransactionsQuery extends QueryPayload {
  sort?: SORT_DIRECTIONS;
  includeUser?: boolean;
  includeAccount?: boolean;
  includeCategory?: boolean;
  includeAll?: boolean;
  nestedInclude?: boolean;
  limit?: number;
  from?: number;
  type?: TRANSACTION_TYPES;
  accountType?: ACCOUNT_TYPES;
  accountId?: number;
}

export type GetTransactionsResponse = TransactionModel[];

export interface UpdateTransactionBody extends BodyPayload {
  amount?: TransactionModel['amount'];
  destinationAmount?: TransactionModel['amount'];
  note?: TransactionModel['note'];
  time?: string;
  transactionType?: TransactionModel['transactionType'];
  paymentType?: TransactionModel['paymentType'];
  accountId?: TransactionModel['accountId'];
  destinationAccountId?: TransactionModel['accountId'];
  categoryId?: TransactionModel['categoryId'];
  isTransfer?: TransactionModel['isTransfer'];
}
