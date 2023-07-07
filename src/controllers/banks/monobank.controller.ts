import axios from 'axios';
import config from 'config';
import PQueue from 'p-queue';
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  differenceInCalendarMonths,
} from 'date-fns';
import {
  API_ERROR_CODES,
  API_RESPONSE_STATUS,
  TRANSACTION_TYPES,
  PAYMENT_TYPES,
  MonobankAccountModel,
  MonobankUserModel,
  endpointsTypes,
} from 'shared-types';
import {
  CustomResponse,
  MonobankClientInfoResponse,
  MonobankTransactionResponse,
} from '@common/types';

import * as monobankAccountsService from '@services/banks/monobank/accounts';
import * as monobankUsersService from '@services/banks/monobank/users';
import * as monobankTransactionsService from '@services/banks/monobank/transactions';

import * as Currencies from '@models/Currencies.model';
import * as MerchantCategoryCodes from '@models/MerchantCategoryCodes.model';
import * as UserMerchantCategoryCodes from '@models/UserMerchantCategoryCodes.model';
import * as Users from '@models/Users.model';

import { logger} from '@js/utils/logger';

const SORT_DIRECTIONS = {
  asc: 'asc',
  desc: 'desc',
};

const usersQuery = new Map();

const hostWebhooksCallback = config.get('hostWebhooksCallback');
const apiPrefix = config.get('apiPrefix');
const hostname = config.get('bankIntegrations.monobank.apiEndpoint');

function dateRange({ from, to }) {
  const difference = differenceInCalendarMonths(
    new Date(Number(to)),
    new Date(Number(from)),
  );
  const dates = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i <= difference; i++) {
    const start = startOfMonth(addMonths(new Date(Number(from)), i));
    const end = endOfMonth(addMonths(new Date(Number(from)), i));

    dates.push({
      start: Number((new Date(start).getTime() / 1000).toFixed(0)),
      end: Number((new Date(end).getTime() / 1000).toFixed(0)),
    });
  }

  return dates;
}

async function updateWebhookAxios({ userToken }: { userToken?: string } = {}) {
  await axios({
    method: 'POST',
    url: `${hostname}/personal/webhook`,
    responseType: 'json',
    headers: {
      'X-Token': userToken,
    },
    data: {
      webHookUrl: `${hostWebhooksCallback}${apiPrefix}/banks/monobank/webhook`,
    },
  });
}

async function createMonoTransaction(
  { data, account, userId }:
  { data: MonobankTransactionResponse, account: MonobankAccountModel, userId: number }
) {
  const existTx = await monobankTransactionsService.getTransactionByOriginalId({
    originalId: data.id,
    userId,
  });

  // check if transaction exists
  if (existTx) {
    return;
  }

  const userData = await monobankUsersService.getUserById({
    id: account.monoUserId,
  });

  let mccId = await MerchantCategoryCodes.getByCode({
    code: data.mcc,
  });

  // check if mcc code exist. If not, create a new with name 'Unknown'
  if (!mccId) {
    mccId = await MerchantCategoryCodes.addCode({ code: data.mcc });
  }

  const userMcc = await UserMerchantCategoryCodes.getByPassedParams({
    mccId: mccId.get('id'),
    userId: userData.systemUserId,
  });

  let categoryId;

  if (userMcc.length) {
    categoryId = userMcc[0].get('categoryId');
  } else {
    categoryId = (
      await Users.getUserDefaultCategory({
        id: userData.systemUserId,
      })
    ).get('defaultCategoryId');

    await UserMerchantCategoryCodes.createEntry({
      mccId: mccId.get('id'),
      userId: userData.systemUserId,
      categoryId,
    });
  }

  await monobankTransactionsService.createTransaction({
    originalId: data.id,
    description: data.description,
    amount: data.amount,
    time: new Date(data.time * 1000),
    operationAmount: data.operationAmount,
    commissionRate: data.commissionRate,
    cashbackAmount: data.cashbackAmount,
    receiptId: data.receiptId,
    balance: data.balance,
    hold: data.hold,
    // TODO: CHECK HOW IT WORKS
    monoAccountId: account.id,
    userId: userData.systemUserId,
    transactionType: data.amount > 0 ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    paymentType: PAYMENT_TYPES.creditCard,
    categoryId,
    currencyId: account.currencyId,
  });

  // eslint-disable-next-line no-console
  logger.info(`New MONOBANK transaction! Amount is ${data.amount}`);
}

export const pairAccount = async (req, res: CustomResponse) => {
  const { token }: endpointsTypes.PairMonobankAccountBody = req.body;
  const { id } = req.user;

  try {
    let user = await monobankUsersService.getUserByToken({ token, userId: id });

    if (!user) {
      const response: string = await req.redisClient.get(token);
      let clientInfo: MonobankClientInfoResponse;

      if (!response) {
        await updateWebhookAxios({ userToken: token });

        clientInfo = (await axios({
          method: 'GET',
          url: `${hostname}/personal/client-info`,
          responseType: 'json',
          headers: {
            'X-Token': token,
          },
        })).data;

        await req.redisClient.set(token, JSON.stringify(response));
        await req.redisClient.expire(token, 60);
      } else {
        clientInfo = JSON.parse(response);
      }

      user = await monobankUsersService.createUser({
        userId: id,
        token,
        clientId: clientInfo.clientId,
        name: clientInfo.name,
        webHookUrl: clientInfo.webHookUrl,
      });

      // TODO: wrap createCurrency and createAccount into single transactions
      const currencyCodes = [...new Set(clientInfo.accounts.map((i) => i.currencyCode))];

      const currencies = await Promise.all(
        currencyCodes.map((code) => Currencies.createCurrency({ code })),
      );

      const accountCurrencyCodes = {};
      currencies.forEach((item) => {
        accountCurrencyCodes[item.number] = item.id;
      });

      await Promise.all(
        clientInfo.accounts.map((account) => monobankAccountsService.createAccount({
          monoUserId: user.id,
          currencyId: accountCurrencyCodes[account.currencyCode],
          accountTypeId: 4,
          accountId: account.id,
          balance: account.balance,
          creditLimit: account.creditLimit,
          cashbackType: account.cashbackType,
          maskedPan: JSON.stringify(account.maskedPan),
          type: account.type,
          iban: account.iban,
          isEnabled: false,
        })),
      );

      (user as MonobankUserModel & { accounts: MonobankClientInfoResponse['accounts'] }).accounts = clientInfo.accounts;

      return res.status(200).json({
        status: API_RESPONSE_STATUS.success,
        response: user,
      });
    }

    return res.status(404).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Account already connected',
        code: API_ERROR_CODES.monobankUserAlreadyConnected,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const getUser = async (req, res: CustomResponse) => {
  const { id } = req.user;

  try {
    const user = await monobankUsersService.getUserBySystemId({
      systemUserId: Number(id),
    });

    if (!user) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Current user does not have any paired monobank user.',
          code: API_ERROR_CODES.monobankUserNotPaired,
        },
      });
    }

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const updateUser = async (req, res: CustomResponse) => {
  const { id: systemUserId } = req.user;
  const { apiToken, name, webHookUrl, clientId }: endpointsTypes.UpdateMonobankUserBody = req.body;

  try {
    const user = await monobankUsersService.updateUser({
      systemUserId,
      apiToken,
      name,
      webHookUrl,
      clientId,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const getTransactions = async (req, res: CustomResponse) => {
  const { id } = req.user;
  const {
    sort = SORT_DIRECTIONS.desc,
    includeUser,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
    from,
    limit,
  } = req.query;

  if (!Object.values(SORT_DIRECTIONS).includes(sort)) {
    return res.status(400).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: `Validation error. Sort direction is invalid! Should be one of [${Object.values(SORT_DIRECTIONS)}]`,
        code: API_ERROR_CODES.validationError,
      },
    });
  }

  try {
    const transactions = await monobankTransactionsService.getTransactions({
      systemUserId: id,
      sortDirection: sort,
      includeUser,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      from,
      limit,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: transactions,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const updateTransaction = async (req, res: CustomResponse) => {
  const { id: userId }: { id: number } = req.user;
  const {
    id,
    categoryId,
    note,
  }: endpointsTypes.UpdateMonobankTransactionBody = req.body;

  try {
    const transaction = await monobankTransactionsService.updateTransactionById({
      id,
      userId,
      categoryId,
      note,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: transaction,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const getAccounts = async (req, res) => {
  const { id } = req.user;

  try {
    const monoUser = await monobankUsersService.getUserBySystemId({ systemUserId: id });

    if (!monoUser) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Current user does not have any paired monobank user.',
          code: API_ERROR_CODES.monobankUserNotPaired,
        },
      });
    }

    const accounts = await monobankAccountsService.getAccountsByUserId({
      monoUserId: monoUser.id,
    });
    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: accounts,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const updateAccount = async (req, res: CustomResponse) => {
  const {
    accountId,
    name,
    isEnabled,
  } = req.body;

  try {
    // TODO: check user is correct. Check account is exist
    const account = await monobankAccountsService.updateById({
      accountId,
      name,
      isEnabled,
    });
    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: account,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const createAccounts = async (req, res: CustomResponse) => {
  const {
    userId,
    accountsIds,
    token,
  }: {
    userId: number;
    accountsIds: string[];
    token: string;
  } = req.body;

  try {
    let response = await req.redisClient.get(token);

    if (!response) {
      response = (await axios({
        method: 'GET',
        url: `${hostname}/personal/client-info`,
        responseType: 'json',
        headers: {
          'X-Token': token,
        },
      })).data;

      await req.redisClient.set(token, JSON.stringify(response));
      await req.redisClient.expire(token, 60000);
    } else {
      response = JSON.parse(response);
    }

    accountsIds.forEach((id) => {
      monobankAccountsService.createAccount({
        monoUserId: userId,
        accountId: id,
      });
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: [],
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const monobankWebhook = async (req, res: CustomResponse) => {
  const { data } = req.body;

  try {
    const monobankAccounts = await monobankAccountsService.getAccountsById({
      accountId: data.account,
    });
    if (!monobankAccounts.length) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Monobank account does not exist!',
        },
      });
    }

    for (const account of monobankAccounts) {
      const user = await monobankUsersService.getUserById({ id: account.monoUserId });

      await createMonoTransaction({
        data: data.statementItem,
        account,
        userId: user.systemUserId,
      });
    }

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const updateWebhook = async (req, res: CustomResponse) => {
  try {
    const { clientId } = req.body;
    const { id } = req.user;

    const token = `monobank-${id}-update-webhook`;
    const tempToken = await req.redisClient.get(token);

    if (!tempToken) {
      await monobankUsersService.updateUser({
        systemUserId: id,
        clientId,
        webHookUrl: `${hostWebhooksCallback}${apiPrefix}/banks/monobank/webhook`,
      });

      // TODO: why here we don't pass userToken?
      await updateWebhookAxios();

      await req.redisClient.set(token, true);
      await req.redisClient.expire(token, 60);

      return res.status(200).json({ status: API_RESPONSE_STATUS.success });
    }

    return res.status(429).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Too many requests! Request cannot be called more that once a minute!',
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const loadTransactions = async (req, res: CustomResponse) => {
  try {
    const { from, to, accountId } = req.query;
    const { id: systemUserId } = req.user;

    const redisToken = `monobank-${systemUserId}-load-transactions`;
    const tempRedisToken = await req.redisClient.get(redisToken);

    if (tempRedisToken) {
      return res.status(403).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'There were too many requests earlier. Please wait at least one minute from when you first saw this message.',
          code: API_ERROR_CODES.forbidden,
        },
      });
    }

    const monobankUser = await monobankUsersService.getUserBySystemId({
      systemUserId,
    });

    if (!monobankUser) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Monobank user does not exist.',
          code: API_ERROR_CODES.notFound,
        },
      });
    }

    // Check mono account exist
    const monobankAccount = await monobankAccountsService.getByAccountId({
      accountId,
      monoUserId: monobankUser.id,
    });

    if (!monobankAccount) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Monobank account does not exist.',
          code: API_ERROR_CODES.notFound,
        },
      });
    }

    // Check is there already created query for data retrieve
    const existQuery = usersQuery.get(`query-${systemUserId}`);

    if (existQuery) {
      logger.error('[Monobank controller]: Query already exists');

      return res.status(429).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: `
            Query already exist and should be fulfilled first. Number of left
            requests is ${existQuery.size}. Try to request a bit later
            (approximately in ${existQuery.size} minutes, since each request
            will take about 60 seconds)
          `,
          code: API_ERROR_CODES.tooManyRequests,
        },
      });
    }

    // Create queue on data retrieving, get months and add queue to global map
    const queue = new PQueue({
      concurrency: 1,
      interval: 60000,
      intervalCap: 1,
    });
    const months = dateRange({ from, to });

    usersQuery.set(`query-${systemUserId}`, queue);

    // eslint-disable-next-line no-restricted-syntax
    for (const month of months) {
      // eslint-disable-next-line no-await-in-loop, no-console
      queue.add(async () => {
        try {
          const { data }: { data: MonobankTransactionResponse[] } = await axios({
            method: 'GET',
            url: `${hostname}/personal/statement/${accountId}/${month.start}/${month.end}`,
            responseType: 'json',
            headers: {
              'X-Token': monobankUser.apiToken,
            },
          });

          for (const item of data) {
            await createMonoTransaction({
              data: item,
              account: monobankAccount,
              userId: systemUserId,
            });
          }
        } catch (err) {
          if (err.response.status === 429) {
            await req.redisClient.set(redisToken, true);
            await req.redisClient.expire(redisToken, 60);

            return res.status(429).json({
              status: API_RESPONSE_STATUS.error,
              response: {
                message: 'Monobank connection error. Too many requests!',
                code: API_ERROR_CODES.tooManyRequests,
              },
            });
          }
        }
      });
    }

    // When all requests are done – delete it from the map
    queue.on('idle', () => {
      logger.info(`[Monobank controller]: All load transactions tasks are done. Size: ${queue.size}  Pending: ${queue.pending}`);
      usersQuery.delete(`query-${systemUserId}`);
    });
    queue.on('add', () => {
      logger.info(`[Monobank controller]: Task to load transactions is added. Size: ${queue.size}  Pending: ${queue.pending}`);
    });
    queue.on('next', () => {
      logger.info(`[Monobank controller]: One of load transactions task is completed. Size: ${queue.size}  Pending: ${queue.pending}`);
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: {
        minutesToFinish: months.length - 1,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};

export const refreshAccounts = async (req, res) => {
  const { id: systemUserId } = req.user;

  try {
    const monoUser = await monobankUsersService.getUserBySystemId({ systemUserId });

    if (!monoUser) {
      return res.status(404).json({
        status: API_RESPONSE_STATUS.error,
        response: {
          message: 'Current user does not have any paired monobank user.',
          code: API_ERROR_CODES.monobankUserNotPaired,
        },
      });
    }

    const token = `monobank-${systemUserId}-client-info`;
    const tempToken = await req.redisClient.get(token);

    if (!tempToken) {
      let clientInfo;
      try {
        clientInfo = (await axios({
          method: 'GET',
          url: `${hostname}/personal/client-info`,
          responseType: 'json',
          headers: {
            'X-Token': monoUser.apiToken,
          },
        })).data;
      } catch (e) {
        if (e.response) {
          if (e.response.data.errorDescription === "Unknown 'X-Token'") {
            // Set user token to empty, since it is already invalid. In that way
            // we can let BE/FE know that last token was invalid and now it
            // needs to be updated
            await monobankUsersService.updateUser({ systemUserId, apiToken: '' });

            return res.status(403).json({
              status: API_RESPONSE_STATUS.error,
              response: {
                code: API_ERROR_CODES.monobankTokenInvalid,
                message: "User's token is invalid!",
              },
            });
          }
        }
        return res.status(500).json({
          status: API_RESPONSE_STATUS.error,
          response: {
            message: 'Something bad happened while trying to contact Monobank!',
          },
        });
      }

      await req.redisClient.set(token, true);
      await req.redisClient.expire(token, 60);

      await Promise.all(
        clientInfo.accounts.map((item) => monobankAccountsService.updateById({
          accountId: item.id,
          currencyCode: item.currencyCode,
          cashbackType: item.cashbackType,
          balance: item.balance,
          creditLimit: item.creditLimit,
          maskedPan: JSON.stringify(item.maskedPan),
          type: item.type,
          iban: item.iban,
          monoUserId: monoUser.id,
        })),
      );

      const accounts = await monobankAccountsService.getAccountsByUserId({
        monoUserId: monoUser.id,
      });

      return res.status(200).json({
        status: API_RESPONSE_STATUS.success,
        response: accounts,
      });
    }

    return res.status(429).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        code: API_ERROR_CODES.tooManyRequests,
        message: 'Too many requests! Request cannot be called more that once a minute!',
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: API_RESPONSE_STATUS.error,
      response: {
        message: 'Unexpected error.',
        code: API_ERROR_CODES.unexpected,
      },
    });
  }
};
