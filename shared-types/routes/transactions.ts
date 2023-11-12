import { TransactionModel, ACCOUNT_TYPES } from 'shared-types';

export interface GetTransactionsQuery {
  sort?: 'ASC' | 'DESC';
  includeUser?: boolean;
  includeAccount?: boolean;
  includeCategory?: boolean;
  includeAll?: boolean;
  nestedInclude?: boolean;
  limit?: number;
  from?: number;
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
  transferNature?: TransactionModel['transferNature'];
}


export interface UpdateTransactionBody {
  amount?: TransactionModel['amount'];
  destinationAmount?: TransactionModel['amount'];
  note?: TransactionModel['note'];
  time?: string;
  transactionType?: TransactionModel['transactionType'];
  paymentType?: TransactionModel['paymentType'];
  accountId?: TransactionModel['accountId'];
  destinationAccountId?: TransactionModel['accountId'];
  categoryId?: TransactionModel['categoryId'];
  transferNature?: TransactionModel['transferNature'];
}
