import axios from 'axios';
import config from 'config';
import {
  TRANSACTION_TYPES,
  ExternalMonobankClientInfoResponse,
  MonobankUserModel,
  ACCOUNT_TYPES,
  ACCOUNT_CATEGORIES,
  API_ERROR_CODES,
} from 'shared-types';
import * as Accounts from '@models/Accounts.model';
import * as monobankUsersService from '@services/banks/monobank/users';
import * as Currencies from '@models/Currencies.model';
import { addUserCurrencies } from '@services/currencies/add-user-currency';
import { redisClient } from '@root/redis';
import { ForbiddenError, NotFoundError, UnexpectedError } from '@js/errors';
import Balances from '@models/Balances.model';
import { calculateRefAmount } from '@services/calculate-ref-amount.service';
import { withTransaction } from './common';
import { redisKeyFormatter } from '@common/lib/redis';

import { getAccountById, createAccount } from '@services/accounts';

const hostname = config.get('bankIntegrations.monobank.apiEndpoint');

export const createSystemAccountsFromMonobankAccounts = withTransaction(
  async ({
    userId,
    monoAccounts,
  }: {
    userId: number;
    monoAccounts: ExternalMonobankClientInfoResponse['accounts'];
  }) => {
    const currencyCodes = [...new Set(monoAccounts.map((i) => i.currencyCode))];

    const currencies = (
      await Promise.all(currencyCodes.map((code) => Currencies.createCurrency({ code })))
    ).filter(Boolean) as Currencies.default[];

    const accountCurrencyCodes = {};
    currencies.forEach((item) => {
      accountCurrencyCodes[item.number] = item.id;
    });

    await addUserCurrencies(
      currencies.map((item) => ({
        userId,
        currencyId: item.id,
      })),
    );

    await Promise.all(
      monoAccounts.map((account) =>
        createAccount({
          userId,
          currencyId: accountCurrencyCodes[account.currencyCode],
          accountCategory: ACCOUNT_CATEGORIES.creditCard,
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
        }),
      ),
    );
  },
);

export const pairMonobankAccount = withTransaction(
  async (payload: { token: string; userId: number }) => {
    const { token, userId } = payload;

    let user = await monobankUsersService.getUserByToken({ token, userId });
    // If user is found, return
    if (user) {
      return { connected: true };
    }

    const redisToken = redisKeyFormatter(token);

    // Otherwise begin user connection
    const response = await redisClient.get(redisToken);
    let clientInfo: ExternalMonobankClientInfoResponse;

    if (!response) {
      // TODO: setup it later
      // await updateWebhookAxios({ userToken: token });

      try {
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

        await redisClient
          .multi()
          .set(redisToken, JSON.stringify(response))
          .expire(redisToken, 60)
          .exec();
      } catch (err) {
        if (err?.response?.data?.errorDescription === "Unknown 'X-Token'") {
          throw new ForbiddenError({
            code: API_ERROR_CODES.monobankTokenInvalid,
            message: 'Monobank rejected this token!',
          });
        } else {
          throw new ForbiddenError({
            code: API_ERROR_CODES.monobankTokenInvalid,
            message: 'Token is invalid!',
          });
        }
      }
    } else {
      clientInfo = JSON.parse(response);
    }

    user = await monobankUsersService.createUser({
      userId,
      token,
      clientId: clientInfo.clientId,
      name: clientInfo.name,
      webHookUrl: clientInfo.webHookUrl,
    });

    await createSystemAccountsFromMonobankAccounts({
      userId,
      monoAccounts: clientInfo.accounts,
    });

    (
      user as MonobankUserModel & {
        accounts: ExternalMonobankClientInfoResponse['accounts'];
      }
    ).accounts = clientInfo.accounts;

    return user;
  },
);

export const updateAccount = withTransaction(
  async ({
    id,
    externalId,
    ...payload
  }: Accounts.UpdateAccountByIdPayload &
    (
      | Pick<Accounts.UpdateAccountByIdPayload, 'id'>
      | Pick<Accounts.UpdateAccountByIdPayload, 'externalId'>
    )) => {
    const accountData = await Accounts.default.findByPk(id);

    if (!accountData) {
      throw new NotFoundError({ message: 'Account not found!' });
    }

    const currentBalanceIsChanging =
      payload.currentBalance !== undefined && payload.currentBalance !== accountData.currentBalance;
    let initialBalance = accountData.initialBalance;
    let refInitialBalance = accountData.refInitialBalance;
    let refCurrentBalance = accountData.refCurrentBalance;

    /**
     * If `currentBalance` is changing, it means user want to change current balance
     * but without creating adjustment transaction, so instead we change both `initialBalance`
     * and `currentBalance` on the same diff
     */
    if (currentBalanceIsChanging && payload.currentBalance !== undefined) {
      const diff = payload.currentBalance - accountData.currentBalance;
      const refDiff = await calculateRefAmount({
        userId: accountData.userId,
        amount: diff,
        baseId: accountData.currencyId,
      });

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

    const result = await Accounts.updateAccountById({
      id,
      externalId,
      initialBalance,
      refInitialBalance,
      refCurrentBalance,
      ...payload,
    });

    if (!result) {
      throw new UnexpectedError(API_ERROR_CODES.unexpected, 'Account updation is not successful');
    }

    await Balances.handleAccountChange({ account: result, prevAccount: accountData });

    return result;
  },
);

const calculateNewBalance = (amount: number, previousAmount: number, currentBalance: number) => {
  if (amount > previousAmount) {
    return currentBalance + (amount - previousAmount);
  } else if (amount < previousAmount) {
    return currentBalance - (previousAmount - amount);
  }

  return currentBalance;
};

const defineCorrectAmountFromTxType = (amount: number, transactionType: TRANSACTION_TYPES) => {
  return transactionType === TRANSACTION_TYPES.income ? amount : amount * -1;
};

// interface updateAccountBalanceRequiredFields {
//   accountId: number;
//   userId: number;
//   transactionType: TRANSACTION_TYPES;
//   currencyId: number;
// }

// At least one of pair (amount + refAmount) OR (prevAmount + prefRefAmount) should be passed
// It is NOT allowed to pass 1 or 3 amount-related arguments

/** For **CREATED** transactions. When only (amount + refAmount) passed */
// export async function updateAccountBalanceForChangedTxImpl(
//   {
//     accountId,
//     userId,
//     transactionType,
//     amount,
//     refAmount,
//     currencyId,
//   }: updateAccountBalanceRequiredFields & { amount: number; refAmount: number },
// ): Promise<void>;

// /** For **DELETED** transactions. When only (prevAmount + prefRefAmount) passed */
// export async function updateAccountBalanceForChangedTxImpl({
//   accountId,
//   userId,
//   transactionType,
//   prevAmount,
//   prevRefAmount,
//   currencyId,
// }: updateAccountBalanceRequiredFields & {
//   prevAmount: number;
//   prevRefAmount: number;
// }): Promise<void>;

// /** For **UPDATED** transactions. When both pairs passed */
// export async function updateAccountBalanceForChangedTxImpl({
//   accountId,
//   userId,
//   transactionType,
//   amount,
//   prevAmount,
//   refAmount,
//   prevRefAmount,
//   currencyId,
//   prevTransactionType,
// }: updateAccountBalanceRequiredFields & {
//   amount: number;
//   prevAmount: number;
//   refAmount: number;
//   prevRefAmount: number;
//   prevTransactionType: TRANSACTION_TYPES;
// }): Promise<void>;

export async function updateAccountBalanceForChangedTxImpl({
  accountId,
  userId,
  transactionType,
  amount = 0,
  prevAmount = 0,
  refAmount = 0,
  prevRefAmount = 0,
  prevTransactionType = transactionType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any): Promise<void> {
  const account = await getAccountById({ id: accountId, userId });

  if (!account) return undefined;

  const { currentBalance, refCurrentBalance } = account;

  const newAmount = defineCorrectAmountFromTxType(amount, transactionType);
  const oldAmount = defineCorrectAmountFromTxType(prevAmount, prevTransactionType);
  const newRefAmount = defineCorrectAmountFromTxType(refAmount, transactionType);
  const oldRefAmount = defineCorrectAmountFromTxType(prevRefAmount, prevTransactionType);

  // TODO: for now keep that deadcode, cause it doesn't really work. But when have time, recheck it past neednes
  // if (currencyId !== accountCurrencyId) {
  //   const { rate } = await userExchangeRateService.getExchangeRate({
  //     userId,
  //     baseId: currencyId,
  //     quoteId: accountCurrencyId,
  //   }, { transaction });

  //   newAmount = defineCorrectAmountFromTxType(amount * rate, transactionType)
  // }

  await Accounts.updateAccountById({
    id: accountId,
    userId,
    currentBalance: calculateNewBalance(newAmount, oldAmount, currentBalance),
    refCurrentBalance: calculateNewBalance(newRefAmount, oldRefAmount, refCurrentBalance),
  });

  // TODO: call Balances service to update balances
}

export const updateAccountBalanceForChangedTx = withTransaction(
  updateAccountBalanceForChangedTxImpl,
);

export const deleteAccountById = withTransaction(async ({ id }: { id: number }) => {
  return Accounts.deleteAccountById({ id });
});
