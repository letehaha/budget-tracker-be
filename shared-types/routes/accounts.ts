import { AccountModel } from 'shared-types';
import { BodyPayload } from './index';

export interface CreateAccountBody extends BodyPayload {
  accountTypeId: AccountModel['accountTypeId'];
  currencyId: AccountModel['currencyId'];
  name: AccountModel['name'];
  initialBalance: AccountModel['initialBalance'];
  creditLimit: AccountModel['creditLimit'];
  isEnabled?: AccountModel['isEnabled'];
  type?: AccountModel['type'];
}

export interface UpdateAccountBody extends BodyPayload {
  accountTypeId?: AccountModel['accountTypeId'];
  name?: AccountModel['name'];
  currentBalance?: AccountModel['currentBalance'];
  creditLimit?: AccountModel['creditLimit'];
  isEnabled?: AccountModel['isEnabled'];
}
