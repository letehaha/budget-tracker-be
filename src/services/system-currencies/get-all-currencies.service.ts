import * as Currencies from '@models/Currencies.model';

export const getAllSystemCurrencies = () => {
  return Currencies.getAllCurrencies();
};
