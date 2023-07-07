import {
  ACCOUNT_TYPES,
  CATEGORY_TYPES,
  TRANSACTION_TYPES,
  PAYMENT_TYPES,
} from 'shared-types';
import { MonobankTransactionResponse } from '@common/types';

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
  systemType: ACCOUNT_TYPES.system,
  id: number;
  name: string;
  currentBalance: number;
  refCurrentBalance: number;
  creditLimit: number;
  refCreditLimit: number;
  accountTypeId: number;
  currencyId: number;
  userId: number;
}

export interface MonobankAccountModel {
  id: number;
  systemType: ACCOUNT_TYPES.monobank,
  accountId: string;
  balance: number;
  creditLimit: number;
  cashbackType: string;
  maskedPan: string[];
  type: string;
  iban: string;
  isEnabled: boolean;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  monoUserId: number;
  currencyId: number;
  accountTypeId: number;
}

export interface MonobankUserModel {
  id: number;
  clientId: string;
  name: string;
  webHookUrl?: string
  systemUserId: number;
  apiToken: string;
}

export interface MonobankTrasnactionModel {
  id: number;
  originalId: MonobankTransactionResponse['id'];
  description: MonobankTransactionResponse['description'];
  amount: MonobankTransactionResponse['amount'];
  time: Date;
  operationAmount: MonobankTransactionResponse['operationAmount'];
  commissionRate: MonobankTransactionResponse['commissionRate'];
  cashbackAmount: MonobankTransactionResponse['cashbackAmount'];
  balance: MonobankTransactionResponse['balance'];
  hold: MonobankTransactionResponse['hold'];
  userId: number;
  categoryId: number;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  monoAccountId: number;
  currencyId: number;
  accountType: ACCOUNT_TYPES;
  note: string;
}
