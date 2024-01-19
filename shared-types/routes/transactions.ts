import {
  TransactionModel,
  ACCOUNT_TYPES,
  SORT_DIRECTIONS,
  TRANSACTION_TYPES,
} from 'shared-types';
import { QueryPayload } from './index';

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

export interface CreateTransactionBody {
  amount: TransactionModel['amount'];
  note?: TransactionModel['note'];
  time: string;
  transactionType: TransactionModel['transactionType'];
  paymentType: TransactionModel['paymentType'];
  accountId: TransactionModel['accountId'];
  categoryId?: TransactionModel['categoryId'];
  destinationAccountId?: TransactionModel['accountId'];
  destinationAmount?: TransactionModel['amount'];
  destinationTransactionId?: number;
  transferNature?: TransactionModel['transferNature'];
}

export interface UpdateTransactionBody {
  amount?: TransactionModel['amount'];
  destinationAmount?: TransactionModel['amount'];
  destinationTransactionId?: TransactionModel['id'];
  note?: TransactionModel['note'];
  time?: string;
  transactionType?: TransactionModel['transactionType'];
  paymentType?: TransactionModel['paymentType'];
  accountId?: TransactionModel['accountId'];
  destinationAccountId?: TransactionModel['accountId'];
  categoryId?: TransactionModel['categoryId'];
  transferNature?: TransactionModel['transferNature'];
}

export interface UnlinkTransferTransactionsBody {
  transferIds: string[];
}
