import { AccountModel } from 'shared-types';
import { BodyPayload } from './index';

export interface UpdateAccountBody extends BodyPayload {
  accountTypeId?: AccountModel['accountTypeId'];
  currencyId?: AccountModel['currencyId'];
  name?: AccountModel['name'];
  currentBalance?: AccountModel['currentBalance'];
  initialBalance?: AccountModel['initialBalance'];
  creditLimit?: AccountModel['creditLimit'];
  isEnabled?: AccountModel['isEnabled'];
}
