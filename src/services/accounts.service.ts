import axios from 'axios';
import config from 'config';
import {
  TRANSACTION_TYPES,
  AccountModel,
  ExternalMonobankClientInfoResponse,
  MonobankUserModel,
  ACCOUNT_TYPES,
} from 'shared-types';
import { Transaction } from 'sequelize/types';
import * as Accounts from '@models/Accounts.model';
import { connection } from '@models/index';
import * as monobankUsersService from '@services/banks/monobank/users';
import * as Currencies from '@models/Currencies.model';
import * as userService from '@services/user.service';
import { GenericSequelizeModelAttributes } from '@common/types';
import { redisClient } from '@root/app';
import { NotFoundError } from '@js/errors';
import Balances from '@models/Balances.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';

export const getAccounts = async (
  payload: Accounts.GetAccountsPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<AccountModel[]> =>
  Accounts.getAccounts(payload, { transaction: attributes.transaction });

export const getAccountsByExternalIds = async (
  payload: Accounts.GetAccountsByExternalIdsPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => Accounts.getAccountsByExternalIds(payload, attributes);

export const getAccountById = async (
  payload: { id: number; userId: number },
  attributes: GenericSequelizeModelAttributes = {},
): Promise<AccountModel> =>
  Accounts.getAccountById(payload, { transaction: attributes.transaction });

const hostname = config.get('bankIntegrations.monobank.apiEndpoint');

export const createSystemAccountsFromMonobankAccounts = async (
  {
    userId,
    monoAccounts,
  }: {
    userId: number;
    monoAccounts: ExternalMonobankClientInfoResponse['accounts'];
  },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  // TODO: wrap createCurrency and createAccount into single transactions
  const currencyCodes = [...new Set(monoAccounts.map((i) => i.currencyCode))];

  const currencies = await Promise.all(
    currencyCodes.map((code) =>
      Currencies.createCurrency(
        { code },
        { transaction: attributes.transaction },
      ),
    ),
  );

  const accountCurrencyCodes = {};
  currencies.forEach((item) => {
    accountCurrencyCodes[item.number] = item.id;
  });

  await userService.addUserCurrencies(
    currencies.map((item) => ({
      userId,
      currencyId: item.id,
    })),
    { transaction: attributes.transaction },
  );

  await Promise.all(
    monoAccounts.map((account) =>
      createAccount(
        {
          userId,
          currencyId: accountCurrencyCodes[account.currencyCode],
          accountTypeId: 4,
          name: account.maskedPan[0] || account.iban,
          externalId: account.id,
          initialBalance: account.balance,
          creditLimit: account.creditLimit,
          externalData: {
            cashbackType: account.cashbackType,
            maskedPan: JSON.stringify(account.maskedPan),
            type: account.type,
            iban: account.iban,
          },
          type: ACCOUNT_TYPES.monobank,
          isEnabled: false,
        },
        { transaction: attributes.transaction },
      ),
    ),
  );
};

export const pairMonobankAccount = async (
  payload: { token: string; userId: number },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const { token, userId } = payload;
    let user = await monobankUsersService.getUserByToken(
      { token, userId },
      { transaction },
    );
    // If user is found, return
    if (user) {
      await transaction.commit();
      return { connected: true };
    }

    // Otherwise begin user connection
    const response: string = await redisClient.get(token);
    let clientInfo: ExternalMonobankClientInfoResponse;

    if (!response) {
      // TODO: setup it later
      // await updateWebhookAxios({ userToken: token });

      const result = await axios({
        method: 'GET',
        url: `${hostname}/personal/client-info`,
        responseType: 'json',
        headers: {
          'X-Token': token,
        },
      });

      if (!result) {
        throw new NotFoundError({
          message:
            '"token" (Monobank API token) is most likely invalid because we cannot find corresponding user.',
        });
      }

      clientInfo = result.data;

      await redisClient.set(token, JSON.stringify(response));
      await redisClient.expire(token, 60);
    } else {
      clientInfo = JSON.parse(response);
    }

    user = await monobankUsersService.createUser(
      {
        userId,
        token,
        clientId: clientInfo.clientId,
        name: clientInfo.name,
        webHookUrl: clientInfo.webHookUrl,
      },
      { raw: true, transaction },
    );

    await createSystemAccountsFromMonobankAccounts({
      userId,
      monoAccounts: clientInfo.accounts,
    });

    (
      user as MonobankUserModel & {
        accounts: ExternalMonobankClientInfoResponse['accounts'];
      }
    ).accounts = clientInfo.accounts;

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return user;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};

export const createAccount = async (
  payload: Omit<
    Accounts.CreateAccountPayload,
    'refCreditLimit' | 'refInitialBalance'
  >,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<AccountModel> => {
  const { userId, creditLimit, currencyId, initialBalance } = payload;
  const refCreditLimit = await calculateRefAmount(
    {
      userId: userId,
      amount: creditLimit,
      baseId: currencyId,
    },
    { transaction: attributes.transaction },
  );

  const refInitialBalance = await calculateRefAmount(
    {
      userId,
      amount: initialBalance,
      baseId: currencyId,
    },
    { transaction: attributes.transaction },
  );

  return Accounts.createAccount(
    {
      ...payload,
      refCreditLimit,
      refInitialBalance,
    },
    { transaction: attributes.transaction },
  );
};

// export async function updateAccount (
//   payload: Accounts.UpdateAccountByIdPayload & {
//     id: Accounts.UpdateAccountByIdPayload['id']
//   },
//   attributes?: GenericSequelizeModelAttributes,
// ): Promise<AccountModel>

// export async function updateAccount (
//   payload: Accounts.UpdateAccountByIdPayload & {
//     externalId: Accounts.UpdateAccountByIdPayload['externalId']
//   },
//   attributes?: GenericSequelizeModelAttributes,
// ): Promise<AccountModel>

export const updateAccount = async (
  {
    id,
    externalId,
    ...payload
  }: Accounts.UpdateAccountByIdPayload &
    (
      | Pick<Accounts.UpdateAccountByIdPayload, 'id'>
      | Pick<Accounts.UpdateAccountByIdPayload, 'externalId'>
    ),
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const isTxPassedFromAbove = attributes.transaction !== undefined;
  const transaction =
    attributes.transaction ?? (await connection.sequelize.transaction());

  try {
    const accountData = await Accounts.default.findByPk(id, { transaction });

    const currentBalanceIsChanging =
      payload.currentBalance !== undefined &&
      payload.currentBalance !== accountData.currentBalance;
    let initialBalance = accountData.initialBalance;
    let refInitialBalance = accountData.refInitialBalance;
    let refCurrentBalance = accountData.refCurrentBalance;

    /**
     * If `currentBalance` is changing, it means user want to change current balance
     * but without creating adjustment transaction, so instead we change both `initialBalance`
     * and `currentBalance` on the same diff
     */
    if (currentBalanceIsChanging) {
      const diff = payload.currentBalance - accountData.currentBalance;
      const refDiff = await calculateRefAmount(
        {
          userId: accountData.userId,
          amount: diff,
          baseId: accountData.currencyId,
        },
        { transaction: attributes.transaction },
      );

      // --- for system accounts
      // change currentBalance => change initialBalance
      // change currentBalance => recalculate refInitialBalance
      // --- for all accounts
      // change currentBalance => recalculate refCurrentBalance
      if (accountData.type === ACCOUNT_TYPES.system) {
        initialBalance += diff;
        refInitialBalance += refDiff;
      }
      refCurrentBalance += refDiff;
    }

    const result = await Accounts.updateAccountById(
      {
        id,
        externalId,
        initialBalance,
        refInitialBalance,
        refCurrentBalance,
        ...payload,
      },
      { transaction },
    );

    await Balances.handleAccountChange(
      { account: result, prevAccount: accountData },
      { transaction },
    );

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }

    return result;
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }
    throw err;
  }
};

const calculateNewBalance = (
  amount: number,
  previousAmount: number,
  currentBalance: number,
) => {
  if (amount > previousAmount) {
    return currentBalance + (amount - previousAmount);
  } else if (amount < previousAmount) {
    return currentBalance - (previousAmount - amount);
  }

  return currentBalance;
};

const defineCorrectAmountFromTxType = (
  amount: number,
  transactionType: TRANSACTION_TYPES,
) => {
  return transactionType === TRANSACTION_TYPES.income ? amount : amount * -1;
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
  {
    accountId,
    userId,
    transactionType,
    amount,
    refAmount,
    currencyId,
  }: updateAccountBalanceRequiredFields & { amount: number; refAmount: number },
  { transaction }: { transaction?: Transaction },
): Promise<void>;

/** For **DELETED** transactions. When only (prevAmount + prefRefAmount) passed */
export async function updateAccountBalanceForChangedTx(
  {
    accountId,
    userId,
    transactionType,
    prevAmount,
    prevRefAmount,
    currencyId,
  }: updateAccountBalanceRequiredFields & {
    prevAmount: number;
    prevRefAmount: number;
  },
  { transaction }: { transaction?: Transaction },
): Promise<void>;

/** For **UPDATED** transactions. When both pairs passed */
export async function updateAccountBalanceForChangedTx(
  {
    accountId,
    userId,
    transactionType,
    amount,
    prevAmount,
    refAmount,
    prevRefAmount,
    currencyId,
    prevTransactionType,
  }: updateAccountBalanceRequiredFields & {
    amount: number;
    prevAmount: number;
    refAmount: number;
    prevRefAmount: number;
    prevTransactionType: TRANSACTION_TYPES;
  },
  { transaction }: { transaction?: Transaction },
): Promise<void>;

export async function updateAccountBalanceForChangedTx(
  {
    accountId,
    userId,
    transactionType,
    amount = 0,
    prevAmount = 0,
    refAmount = 0,
    prevRefAmount = 0,
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
  const { currentBalance, refCurrentBalance } = await getAccountById(
    { id: accountId, userId },
    { transaction },
  );

  const newAmount = defineCorrectAmountFromTxType(amount, transactionType);
  const oldAmount = defineCorrectAmountFromTxType(
    prevAmount,
    prevTransactionType,
  );
  const newRefAmount = defineCorrectAmountFromTxType(
    refAmount,
    transactionType,
  );
  const oldRefAmount = defineCorrectAmountFromTxType(
    prevRefAmount,
    prevTransactionType,
  );

  // TODO: for now keep that deadcode, cause it doesn't really work. But when have time, recheck it past neednes
  // if (currencyId !== accountCurrencyId) {
  //   const { rate } = await userExchangeRateService.getExchangeRate({
  //     userId,
  //     baseId: currencyId,
  //     quoteId: accountCurrencyId,
  //   }, { transaction });

  //   newAmount = defineCorrectAmountFromTxType(amount * rate, transactionType)
  // }

  await Accounts.updateAccountById(
    {
      id: accountId,
      userId,
      currentBalance: calculateNewBalance(newAmount, oldAmount, currentBalance),
      refCurrentBalance: calculateNewBalance(
        newRefAmount,
        oldRefAmount,
        refCurrentBalance,
      ),
    },
    { transaction },
  );
}

export const deleteAccountById = async (
  { id }: { id: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Accounts.deleteAccountById({ id }, { transaction });
};
