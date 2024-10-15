import axios from 'axios';
import config from 'config';
import {
  ExternalMonobankClientInfoResponse,
  MonobankUserModel,
  ACCOUNT_TYPES,
  ACCOUNT_CATEGORIES,
  API_ERROR_CODES,
} from 'shared-types';
import * as monobankUsersService from '@services/banks/monobank/users';
import * as Currencies from '@models/Currencies.model';
import { addUserCurrencies } from '@services/currencies/add-user-currency';
import { redisClient } from '@root/redis';
import { ForbiddenError, NotFoundError } from '@js/errors';
import { withTransaction } from './common';
import { redisKeyFormatter } from '@common/lib/redis';

import { createAccount } from '@services/accounts';

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
