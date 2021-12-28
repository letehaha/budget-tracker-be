import axios from 'axios';
import config from 'config';
import PQueue from 'p-queue';
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  differenceInCalendarMonths,
} from 'date-fns';

import * as MonobankUsers from '../../models/banks/monobank/Users.model';
import * as MonobankAccounts from '../../models/banks/monobank/Accounts.model';
import * as MonobankTransactions from '../../models/banks/monobank/Transactions.model';
import * as Currencies from '../../models/Currencies.model';
import * as MerchantCategoryCodes from '../../models/MerchantCategoryCodes.model';
import * as UserMerchantCategoryCodes from '../../models/UserMerchantCategoryCodes.model';
import * as Users from '../../models/Users.model';
import * as TransactionEntities from '../../models/TransactionEntities.model';

import { logger } from '../../js/utils';
import { TRANSACTION_ENTITIES, ERROR_CODES } from '../../js/const';

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

async function createMonoTransaction({ data, account, userId }) {
  const existTx = await MonobankTransactions.getTransactionByOriginalId({
    originalId: data.id,
    userId,
  });

  // check if transaction exists
  if (existTx) {
    return;
  }

  const userData = await MonobankUsers.getById({
    id: account.get('monoUserId'),
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
    userId: userData.get('systemUserId'),
  });

  let categoryId;

  if (userMcc.length) {
    categoryId = userMcc[0].get('categoryId');
  } else {
    categoryId = (
      await Users.getUserDefaultCategory({
        id: userData.get('systemUserId'),
      })
    ).get('defaultCategoryId');

    await UserMerchantCategoryCodes.createEntry({
      mccId: mccId.get('id'),
      userId: userData.get('systemUserId'),
      categoryId,
    });
  }

  const entity = await TransactionEntities.getTransactionEntityByType({
    type: TRANSACTION_ENTITIES.monobank,
  });

  await MonobankTransactions.createTransaction({
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
    monoAccountId: account.get('id'),
    userId: userData.get('systemUserId'),
    transactionTypeId: data.amount > 0 ? 1 : 2,
    paymentTypeId: 6,
    categoryId,
    currencyId: account.get('currencyId'),
    transactionEntityId: entity.get('id'),
  });

  // eslint-disable-next-line no-console
  console.log(`New MONOBANK transaction! Amount is ${data.amount}`);
}

export const pairAccount = async (req, res, next) => {
  const { token } = req.body;
  const { id } = req.user;

  try {
    let user = await MonobankUsers.getUserByToken({ token, userId: id });

    if (!user) {
      let response = await req.redisClient.get(token);

      if (!response) {
        await updateWebhookAxios({ userToken: token });

        response = (await axios({
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
        response = JSON.parse(response);
      }

      user = await MonobankUsers.createUser({
        userId: id,
        token,
        clientId: response.clientId,
        name: response.name,
        webHookUrl: response.webHookUrl,
      });

      // TODO: wrap createCurrency and createAccount into single transactions
      const currencyCodes = [...new Set(response.accounts.map((i) => i.currencyCode))];

      const currencies = await Promise.all(
        currencyCodes.map((code) => Currencies.createCurrency({ code })),
      );

      const accountCurrencyCodes = {};
      currencies.forEach((item) => {
        accountCurrencyCodes[item.number] = item.id;
      });

      await Promise.all(
        response.accounts.map((account) => MonobankAccounts.createAccount({
          monoUserId: user.get('id'),
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

      user.setDataValue('accounts', response.accounts);

      return res.status(200).json({ response: user });
    }

    return res.status(404).json({
      status: 'error',
      message: 'Account already connected',
      code: ERROR_CODES.monobankUserAlreadyConnected,
    });
  } catch (err) {
    return next(new Error(err));
  }
};

export const getUser = async (req, res, next) => {
  const { id } = req.user;

  try {
    const user = await MonobankUsers.getUser({
      systemUserId: id,
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Current user does not have any paired monobank user.',
        code: ERROR_CODES.monobankUserNotPaired,
      });
    }

    return res.status(200).json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};

export const updateUser = async (req, res, next) => {
  const { id: systemUserId } = req.user;
  const { apiToken, name } = req.body;

  try {
    const user = await MonobankUsers.updateUser({
      systemUserId,
      apiToken,
      name,
    });

    return res.status(200).json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};

export const getTransactions = async (req, res, next) => {
  const { id } = req.user;
  const {
    sort = SORT_DIRECTIONS.desc,
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
    from,
    limit,
  } = req.query;

  if (!Object.values(SORT_DIRECTIONS).includes(sort)) {
    return next(new Error(`Sort direction is invalid! Should be one of [${Object.values(SORT_DIRECTIONS)}]`));
  }

  try {
    const transactions = await MonobankTransactions.getTransactions({
      systemUserId: id,
      sortDirection: sort,
      includeUser,
      includeTransactionType,
      includePaymentType,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
      from,
      limit,
    });

    return res.status(200).json({ response: transactions });
  } catch (err) {
    return next(new Error(err));
  }
};

export const updateTransaction = async (req, res, next) => {
  const { id: userId } = req.user;
  const {
    id,
    categoryId,
    note,
  } = req.body;

  try {
    const transaction = await MonobankTransactions.updateTransactionById({
      id,
      userId,
      categoryId,
      note,
    });

    return res.status(200).json({ response: transaction });
  } catch (err) {
    return next(new Error(err));
  }
};

export const getAccounts = async (req, res, next) => {
  const { id } = req.user;

  try {
    const monoUser = await MonobankUsers.getUser({ systemUserId: id });

    if (!monoUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Current user does not have any paired monobank user.',
        code: ERROR_CODES.monobankUserNotPaired,
      });
    }

    const accounts = await MonobankAccounts.getAccountsByUserId({
      monoUserId: monoUser.get('id'),
    });
    return res.status(200).json({ response: accounts });
  } catch (err) {
    return next(new Error(err));
  }
};

export const updateAccount = async (req, res, next) => {
  const {
    accountId,
    name,
    isEnabled,
  } = req.body;

  try {
    // TODO: check user is correct. Check account is exist
    const account = await MonobankAccounts.updateById({
      accountId,
      name,
      isEnabled,
    });
    return res.status(200).json({ response: account });
  } catch (err) {
    return next(new Error(err));
  }
};

export const createAccounts = async (req, res, next) => {
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
      MonobankAccounts.createAccount({
        monoUserId: userId,
        accountId: id,
      });
    });

    return res.status(200).json({ response: [] });
  } catch (err) {
    return next(new Error(err));
  }
};

export const monobankWebhook = async (req, res, next) => {
  const { data } = req.body;

  try {
    const monobankAccounts = await MonobankAccounts.getAccountsById({
      accountId: data.account,
    });
    if (!monobankAccounts.length) {
      return res.status(404).json({ message: 'Monobank account does not exist!' });
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const account of monobankAccounts) {
      // eslint-disable-next-line no-await-in-loop
      const user = await MonobankUsers.getById({ id: account.get('monoUserId') });
      // eslint-disable-next-line no-await-in-loop
      await createMonoTransaction({
        data: data.statementItem,
        account,
        userId: user.get('systemUserId'),
      });
    }

    return res.status(200).json({ message: 'success' });
  } catch (err) {
    return next(new Error(err));
  }
};

export const updateWebhook = async (req, res, next) => {
  try {
    const { clientId } = req.body;
    const { id } = req.user;

    const token = `monobank-${id}-update-webhook`;
    const tempToken = await req.redisClient.get(token);

    if (!tempToken) {
      await MonobankUsers.updateWebhook({
        systemUserId: id,
        clientId,
        webHookUrl: `${hostWebhooksCallback}${apiPrefix}/banks/monobank/webhook`,
      });

      // TODO: why here we don't pass userToken?
      await updateWebhookAxios();

      await req.redisClient.set(token, true);
      await req.redisClient.expire(token, 60);

      return res.status(200).json({ status: 'ok' });
    }

    return res.status(429).json({
      status: 'error',
      message: 'Too many requests! Request cannot be called more that once a minute!',
    });
  } catch (err) {
    return next(new Error(err));
  }
};

export const loadTransactions = async (req, res, next) => {
  try {
    const { from, to, accountId } = req.query;
    const { id: systemUserId } = req.user;

    const monobankUser = await MonobankUsers.getUser({
      systemUserId,
    });

    if (!monobankUser) {
      return res.status(404).json({ message: 'Monobank user does not exist.' });
    }

    // Check mono account exist
    const monobankAccount = await MonobankAccounts.getByAccountId({
      accountId,
      monoUserId: monobankUser.get('id'),
    });

    if (!monobankAccount) {
      return res.status(404).json({ message: 'Monobank account does not exist.' });
    }

    // Check is there already created query for data retrieve
    const existQuery = usersQuery.get(`query-${systemUserId}`);

    if (existQuery) {
      logger.error('[Monobank controller]: Query already exists');

      return res.status(403).json({
        status: 'error',
        message: `Query already exist and should be fulfilled first. Number of left requests is ${existQuery.size}. Try to request a bit later (approximately in ${existQuery.size} minutes, since each request will take about 60 seconds)`,
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
        const { data } = await axios({
          method: 'GET',
          url: `${hostname}/personal/statement/${accountId}/${month.start}/${month.end}`,
          responseType: 'json',
          headers: {
            'X-Token': monobankUser.get('apiToken'),
          },
        });

        // eslint-disable-next-line no-restricted-syntax
        for (const item of data) {
          // eslint-disable-next-line no-await-in-loop
          await createMonoTransaction({
            data: item,
            account: monobankAccount,
            userId: systemUserId,
          });
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
      status: 'ok',
      minutesToFinish: months.length,
    });
  } catch (err) {
    return next(new Error(err));
  }
};

export const refreshAccounts = async (req, res, next) => {
  const { id: systemUserId } = req.user;

  try {
    const monoUser = await MonobankUsers.getUser({ systemUserId });

    if (!monoUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Current user does not have any paired monobank user.',
        code: ERROR_CODES.monobankUserNotPaired,
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
            'X-Token': monoUser.get('apiToken'),
          },
        })).data;
      } catch (e) {
        if (e.response) {
          if (e.response.data.errorDescription === "Unknown 'X-Token'") {
            // Set user token to empty, since it is already invalid. In that way
            // we can let BE/FE know that last token was invalid and now it
            // needs to be updated
            await MonobankUsers.updateUser({ systemUserId, apiToken: '' });

            return res.status(403).json({
              status: 'error',
              code: ERROR_CODES.monobankTokenInvalid,
              message: "User's token is invalid!",
            });
          }
        }
        return res.status(400).json({
          status: 'error',
          message: 'Something bad happened while trying to contact Monobank!',
        });
      }

      await req.redisClient.set(token, true);
      await req.redisClient.expire(token, 60);

      await Promise.all(
        clientInfo.accounts.map((item) => MonobankAccounts.updateById({
          accountId: item.id,
          currencyCode: item.currencyCode,
          cashbackType: item.cashbackType,
          balance: item.balance,
          creditLimit: item.creditLimit,
          maskedPan: JSON.stringify(item.maskedPan),
          type: item.type,
          iban: item.iban,
          monoUserId: monoUser.get('id'),
        })),
      );

      const accounts = await MonobankAccounts.getAccountsByUserId({
        monoUserId: monoUser.get('id'),
      });

      return res.status(200).json({ response: accounts });
    }

    return res.status(429).json({
      status: 'error',
      code: ERROR_CODES.tooManyRequests,
      message: 'Too many requests! Request cannot be called more that once a minute!',
    });
  } catch (err) {
    return next(new Error(err));
  }
};