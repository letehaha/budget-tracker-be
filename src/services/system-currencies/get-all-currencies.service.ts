import * as Currencies from '@models/Currencies.model';
import { withTransaction } from '../common';

export const getAllSystemCurrencies = withTransaction(() => {
  return Currencies.getAllCurrencies();
});
