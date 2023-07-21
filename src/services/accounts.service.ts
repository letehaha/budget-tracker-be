import axios from 'axios';
import config from 'config';
import {
  TRANSACTION_TYPES,
  AccountModel,
  ACCOUNT_TYPES,
  ExternalMonobankClientInfoResponse,
  MonobankUserModel,
} from 'shared-types';
import { Transaction } from 'sequelize/types';
import * as userExchangeRateService from '@services/user-exchange-rate';
import * as Accounts from '@models/Accounts.model';
import { connection } from '@models/index';
import * as monobankUsersService from '@services/banks/monobank/users';
import * as Currencies from '@models/Currencies.model';
import { GenericSequelizeModelAttributes } from '@common/types';
import { redisClient } from '@root/app';

const normalizeAccount = (account: Accounts.default): AccountModel => ({
  ...(account.dataValues || account),
  type: ACCOUNT_TYPES.system,
})

export const getAccounts = async (
  payload: Accounts.GetAccountsPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<AccountModel[]> => {
  const accounts = await Accounts.getAccounts(
    payload,
    { transaction: attributes.transaction },
  );

  const normalizedAccounts: AccountModel[] = accounts.map(normalizeAccount)

  return normalizedAccounts;
}

export const getAccountById = async (
  payload: { id: number; userId: number },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<AccountModel> => {
  const account = await Accounts.getAccountById(
    payload,
    { transaction: attributes.transaction },
  );

  return normalizeAccount(account);
};

const hostname = config.get('bankIntegrations.monobank.apiEndpoint');

export const pairMonobankAccount = async (
  payload: { token: string; userId: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction = attributes.transaction ?? await connection.sequelize.transaction();

  try {
    const { token, userId } = payload;
    let user = await monobankUsersService.getUserByToken({ token, userId }, { transaction });
    // If user is found, return
    if (user) return { connected: true }

    // Otherwise begin user connection
    const response: string = await redisClient.get(token);
    let clientInfo: ExternalMonobankClientInfoResponse;

    if (!response) {
      // TODO: setup it later
      // await updateWebhookAxios({ userToken: token });

      clientInfo = (await axios({
        method: 'GET',
        url: `${hostname}/personal/client-info`,
        responseType: 'json',
        headers: {
          'X-Token': token,
        },
      })).data;

      await redisClient.set(token, JSON.stringify(response));
      await redisClient.expire(token, 60);
    } else {
      clientInfo = JSON.parse(response);
    }

    user = await monobankUsersService.createUser({
      userId,
      token,
      clientId: clientInfo.clientId,
      name: clientInfo.name,
      webHookUrl: clientInfo.webHookUrl,
    }, { transaction });

    // TODO: wrap createCurrency and createAccount into single transactions
    const currencyCodes = [...new Set(clientInfo.accounts.map((i) => i.currencyCode))];

    const currencies = await Promise.all(
      currencyCodes.map((code) => Currencies.createCurrency({ code }, { transaction })),
    );

    const accountCurrencyCodes = {};
    currencies.forEach((item) => {
      accountCurrencyCodes[item.number] = item.id;
    });

    await Promise.all(
      clientInfo.accounts.map((account) => createAccount({
        userId,
        currencyId: accountCurrencyCodes[account.currencyCode],
        accountTypeId: 4,
        name: account.maskedPan[0] || account.iban,
        externalId: account.id,
        currentBalance: account.balance,
        creditLimit: account.creditLimit,
        externalData: {
          cashbackType: account.cashbackType,
          maskedPan: JSON.stringify(account.maskedPan),
          type: account.type,
          iban: account.iban,
        },
        isEnabled: false,
      }, { transaction })),
    );

    (user as MonobankUserModel & { accounts: ExternalMonobankClientInfoResponse['accounts'] }).accounts = clientInfo.accounts;

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return user;
  } catch (err) {
    console.log('err', err)
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
}

export const createAccount = async (
  payload: {
    accountTypeId: Accounts.AccountsAttributes['accountTypeId'];
    currencyId: Accounts.AccountsAttributes['currencyId'];
    name: Accounts.AccountsAttributes['name'];
    currentBalance: Accounts.AccountsAttributes['currentBalance'];
    creditLimit: Accounts.AccountsAttributes['creditLimit'];
    userId: Accounts.AccountsAttributes['userId'];
    externalId?: Accounts.AccountsAttributes['externalId'];
    isEnabled?: Accounts.AccountsAttributes['isEnabled'];
    externalData?: Accounts.AccountsAttributes['externalData'];
  },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<AccountModel> => {
  const account = await Accounts.createAccount({
    initialBalance: payload.currentBalance,
    ...payload,
  }, { transaction: attributes.transaction });

  return normalizeAccount(account);
}

export async function updateAccount (
  payload: Accounts.UpdateAccountByIdPayload & {
    id: Accounts.UpdateAccountByIdPayload['id']
  },
  attributes?: GenericSequelizeModelAttributes,
): Promise<AccountModel>

export async function updateAccount (
  payload: Accounts.UpdateAccountByIdPayload & {
    externalId: Accounts.UpdateAccountByIdPayload['externalId']
  },
  attributes?: GenericSequelizeModelAttributes,
): Promise<AccountModel>

export async function updateAccount (
  { id, externalId, ...payload }: Accounts.UpdateAccountByIdPayload,
  attributes?: GenericSequelizeModelAttributes,
): Promise<AccountModel> {
  const data = await Accounts.updateAccountById(
    { id, externalId, ...payload },
    { transaction: attributes.transaction },
  );

  return data;
}

const calculateNewBalance = (
  amount: number,
  previousAmount: number,
  currentBalance: number,
) => {
  if (amount > previousAmount) {
    return currentBalance + (amount - previousAmount)
  } else if (amount < previousAmount) {
    return currentBalance - (previousAmount - amount)
  }

  return currentBalance
}

const defineCorrectAmountFromTxType = (amount: number, transactionType: TRANSACTION_TYPES) => {
  return transactionType === TRANSACTION_TYPES.income
    ? amount
    : amount * -1
};

interface updateAccountBalanceRequiredFields {
  accountId: number;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  currencyId: number;
}

// At least one of pair (amount + refAmount) OR (prevAmount + prefRefAmount) should be passed
// It is NOT allowed to pass 1 or 3 amount-related arguments

/** For **CREATED** transactions. When only (amount + refAmount) passed */
export async function updateAccountBalanceForChangedTx(
  { accountId, userId, transactionType, amount, refAmount, currencyId }:
  updateAccountBalanceRequiredFields & { amount: number, refAmount: number },
  { transaction }: { transaction?: Transaction }
): Promise<void>

/** For **DELETED** transactions. When only (prevAmount + prefRefAmount) passed */
export async function updateAccountBalanceForChangedTx(
  { accountId, userId, transactionType, prevAmount, prevRefAmount, currencyId }:
  updateAccountBalanceRequiredFields & { prevAmount: number; prevRefAmount: number },
  { transaction }: { transaction?: Transaction }
): Promise<void>

/** For **UPDATED** transactions. When both pairs passed */
export async function updateAccountBalanceForChangedTx(
  { accountId, userId, transactionType, amount, prevAmount, refAmount, prevRefAmount, currencyId, prevTransactionType }:
  updateAccountBalanceRequiredFields & { amount: number; prevAmount: number; refAmount: number; prevRefAmount: number; prevTransactionType: TRANSACTION_TYPES },
  { transaction }: { transaction?: Transaction }
): Promise<void>

export async function updateAccountBalanceForChangedTx (
  {
    accountId,
    userId,
    transactionType,
    amount = 0,
    prevAmount = 0,
    refAmount = 0,
    prevRefAmount = 0,
    currencyId,
    prevTransactionType = transactionType,
  }: updateAccountBalanceRequiredFields & {
    amount?: number;
    prevAmount?: number;
    refAmount?: number;
    prevRefAmount?: number;
    prevTransactionType?: TRANSACTION_TYPES;
  },
  { transaction }: { transaction?: Transaction } = {},
): Promise<void> {
  const { currentBalance, refCurrentBalance, currencyId: accountCurrencyId } = await getAccountById(
    { id: accountId, userId },
    { transaction },
  );

  let newAmount = defineCorrectAmountFromTxType(amount, transactionType)
  const oldAmount = defineCorrectAmountFromTxType(prevAmount, prevTransactionType)
  const newRefAmount = defineCorrectAmountFromTxType(refAmount, transactionType)
  const oldRefAmount = defineCorrectAmountFromTxType(prevRefAmount, prevTransactionType)

  if (currencyId !== accountCurrencyId) {
    const { rate } = await userExchangeRateService.getExchangeRate({
      userId,
      baseId: currencyId,
      quoteId: accountCurrencyId,
    }, { transaction });

    newAmount = defineCorrectAmountFromTxType(amount * rate, transactionType)
  }

  await Accounts.updateAccountById({
    id: accountId,
    userId,
    currentBalance: calculateNewBalance(newAmount, oldAmount, currentBalance),
    refCurrentBalance: calculateNewBalance(newRefAmount, oldRefAmount, refCurrentBalance),
  }, { transaction });
}

export const deleteAccountById = async (
  { id }: { id: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Accounts.deleteAccountById({ id }, { transaction });
};
