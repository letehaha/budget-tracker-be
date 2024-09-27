import { TransactionModel, ACCOUNT_TYPES, SORT_DIRECTIONS, TRANSACTION_TYPES } from 'shared-types';
import { QueryPayload } from './index';

export interface GetTransactionsQuery extends QueryPayload {
  sort?: SORT_DIRECTIONS;
  limit?: number;
  from?: number;
  type?: TRANSACTION_TYPES;
  accountType?: ACCOUNT_TYPES;
  accountId?: number;
  excludeTransfer?: boolean;
  excludeRefunds?: boolean;
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
  // When transaction is being created, it can be marked as a refund for another transaction
  refundForTxId?: number;
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
  // Pass tx id if you want to mark which tx it refunds
  refundsTxId?: number | null;
  // Pass tx ids that will refund the source tx
  refundedByTxIds?: number[] | null;
}

export interface UnlinkTransferTransactionsBody {
  transferIds: string[];
}
// Array of income/expense pairs to link between each other. It's better to pass
// exactly exactly as described in the type, but in fact doesn't really matter
export interface LinkTransactionsBody {
  ids: [baseTxId: number, destinationTxId: number][];
}
