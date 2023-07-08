import { MonobankAccountModel, ACCOUNT_TYPES } from 'shared-types';
import * as MonobankAccounts from '@models/banks/monobank/Accounts.model';
import { GenericSequelizeModelAttributes } from '@common/types';

const normalizeAccount = (account: MonobankAccounts.default): MonobankAccountModel =>
  ({
    ...account,
    maskedPan: JSON.parse(account.maskedPan),
    systemType: ACCOUNT_TYPES.monobank,
  })

export const createAccount = async (
  payload: MonobankAccounts.MonoAccountCreationPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankAccountModel> => {
  const account = await MonobankAccounts.createAccount(payload, attributes);

  return normalizeAccount(account);
}

export const getAccountsById = async (
  { accountId },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankAccountModel[]> => {
  const accounts = await MonobankAccounts.getAccountsById({ accountId }, attributes);

  return accounts.map(normalizeAccount);
};

export const getByAccountId = async (
  { accountId, monoUserId },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankAccountModel>  => {
  const account = await MonobankAccounts.getByAccountId(
    { accountId, monoUserId },
    attributes,
  );

  return normalizeAccount(account);
};

export const getAccountsByUserId = async (
  { monoUserId },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankAccountModel[]>  => {
  const accounts = await MonobankAccounts.getAccountsByUserId(
    { monoUserId },
    attributes,
  );

  return accounts.map(normalizeAccount);
};

export const updateById = async (
  payload: MonobankAccounts.MonoAccountUpdatePayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankAccountModel> => {
  const account = await MonobankAccounts.updateById(payload, attributes);

  return normalizeAccount(account);
};
