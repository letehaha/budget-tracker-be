import { Response } from 'express';
import { ACCOUNT_TYPES, type endpointsTypes, ACCOUNT_CATEGORIES } from 'shared-types';
import Accounts from '@models/Accounts.model';
import Currencies from '@models/Currencies.model';
import { makeRequest } from './common';
import { updateAccount as apiUpdateAccount } from '@root/services/accounts.service';
import { addUserCurrencies, getCurrenciesRates } from './currencies';

export const buildAccountPayload = (
  overrides: Partial<endpointsTypes.CreateAccountBody> = {},
): endpointsTypes.CreateAccountBody => ({
  accountCategory: ACCOUNT_CATEGORIES.general,
  currencyId: global.BASE_CURRENCY.id,
  name: 'test',
  type: ACCOUNT_TYPES.system,
  initialBalance: 0,
  creditLimit: 0,
  ...overrides,
});
type BuildAccountPayload = ReturnType<typeof buildAccountPayload>;

export function getAccount({ id, raw }: { id: number; raw: false }): Promise<Response>;
export function getAccount({ id, raw }: { id: number; raw: true }): Promise<Accounts>;
export function getAccount({ id, raw = false }: { id: number; raw?: boolean }) {
  return makeRequest({
    method: 'get',
    url: `/accounts/${id}`,
    raw,
  });
}

export function getAccounts(): Promise<Accounts[]> {
  return makeRequest({
    method: 'get',
    url: `/accounts`,
    raw: true,
  });
}

/**
 * Creates an account. By default for base currency, but any payload can be passed
 */
export function createAccount(): Promise<Response>;
export function createAccount({ payload, raw }: { payload?: BuildAccountPayload; raw: false }): Promise<Response>;
export function createAccount({ payload, raw }: { payload?: BuildAccountPayload; raw: true }): Promise<Accounts>;
export function createAccount({ payload = buildAccountPayload(), raw = false } = {}) {
  return makeRequest({
    method: 'post',
    url: '/accounts',
    payload,
    raw,
  });
}

export function updateAccount<
  T = Awaited<ReturnType<typeof apiUpdateAccount>>,
  R extends boolean | undefined = undefined,
>({ id, payload = {}, raw }: { id: number; payload?: Partial<BuildAccountPayload>; raw?: R }) {
  return makeRequest<T, R>({
    method: 'put',
    url: `/accounts/${id}`,
    payload,
    raw,
  });
}

export const createAccountWithNewCurrency = async ({ currency }) => {
  const currencyA: Currencies = global.MODELS_CURRENCIES.find((item) => item.code === currency);
  await addUserCurrencies({ currencyCodes: [currencyA.code] });

  const account = await createAccount({
    payload: {
      ...buildAccountPayload(),
      currencyId: currencyA.id,
    },
    raw: true,
  });
  const currencyRate = (await getCurrenciesRates({ codes: [currency] }))[0];

  return { account, currency: currencyA, currencyRate };
};
