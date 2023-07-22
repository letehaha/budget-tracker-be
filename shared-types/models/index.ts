import {
  ACCOUNT_TYPES,
  CATEGORY_TYPES,
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
