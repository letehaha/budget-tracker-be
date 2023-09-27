import { TRANSACTION_TYPES, PAYMENT_TYPES } from 'shared-types';
import * as Transactions from '@models/Transactions.model';

export type CreateTransactionParams = Omit<Transactions.CreateTransactionPayload, 'refAmount' | 'currencyId' | 'currencyCode' | 'transferId' | 'refCurrencyCode'> & {
  destinationAmount?: number;
  destinationAccountId?: number;
}

interface UpdateParams {
  id: number;
  userId: number;
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

export type UpdateTransactionParams = UpdateParams & UpdateTransferParams;
