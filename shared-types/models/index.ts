import {
  ACCOUNT_TYPES,
  CATEGORY_TYPES,
  TRANSACTION_TYPES,
  PAYMENT_TYPES,
} from 'shared-types';
export * from './external-services';

export interface UserModel {
	id: number;
	username: string;
	email: string;
	password?: string;
	firstName: string;
	lastName: string;
	middleName: string;
	avatar: string;
	totalBalance: number;
	defaultCategoryId: number;
}


export interface CategoryModel {
  color: string;
  id: number;
  imageUrl: null | string;
  name: string;
  parentId: null | number;
  subCategories: CategoryModel[];
  type: CATEGORY_TYPES;
  userId: number;
}

export interface AccountModel {
  type: ACCOUNT_TYPES,
  id: number;
  name: string;
  initialBalance: number;
  currentBalance: number;
  refCurrentBalance: number;
  creditLimit: number;
  refCreditLimit: number;
  accountTypeId: number;
  currencyId: number;
  userId: number;
  externalId?: string;
  externalData?: object;
  isEnabled: boolean;
}

export interface MonobankUserModel {
  id: number;
  clientId: string;
  name: string;
  webHookUrl?: string
  systemUserId: number;
  apiToken: string;
}

export interface BalanceModel {
  id: number;
  date: Date;
  amount: number;
  accountId: number;
  account: Omit<AccountModel, 'systemType'>;
}

export interface TransactionModel {
  id: number;
  amount: number;
  // Amount in base currency
  refAmount: number;
  note: string;
  time: Date;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  accountId: number;
  categoryId: number;
  currencyId: number;
  currencyCode: string;
  accountType: ACCOUNT_TYPES;
  refCurrencyCode: string;

  // is transaction transfer?
  isTransfer: boolean;
  // (hash, used to connect two transactions)
  transferId: string;

  originalId: string; // Stores the original id from external source
  externalData: object; // JSON of any addition fields
  // balance: number;
  // hold: boolean;
  // receiptId: string;
  commissionRate: number; // should be comission calculated as refAmount
  refCommissionRate: number; // should be comission calculated as refAmount
  cashbackAmount: number; // add to unified
}
