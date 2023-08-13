import { TransactionModel } from 'shared-types';
import { BodyPayload } from './index';

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
