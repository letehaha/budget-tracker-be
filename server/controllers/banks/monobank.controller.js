const axios = require('axios').default;
const config = require('config');
const { default: PQueue } = require('p-queue');
const {
  addMonths,
  endOfMonth,
  startOfMonth,
  differenceInCalendarMonths,
} = require('date-fns');

const {
  MonobankUsers,
  MonobankAccounts,
  MonobankTransactions,
  Currencies,
  MerchantCategoryCodes,
  UserMerchantCategoryCodes,
  Users,
} = require('@models');

const SORT_DIRECTIONS = {
  asc: 'asc',
  desc: 'desc',
};

const usersQuery = new Map();

const hostWebhooksCallback = config.get('hostWebhooksCallback');
const apiPrefix = config.get('apiPrefix');
const hostname = config.get('bankIntegrations.monobank.apiEndpoint');
const userToken = config.get('bankIntegrations.monobank.apiToken');

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

async function updateWebhook() {
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

async function createMonoTransaction({ data, account }) {
  const existTx = await MonobankTransactions.getTransactionById({
    id: data.id,
  });

  // check if transactions exist
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

  await MonobankTransactions.createTransaction({
    id: data.id,
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
  });

  // eslint-disable-next-line no-console
  console.log(`New MONOBANK transaction! Amount is ${data.amount}`);
}

exports.pairAccount = async (req, res, next) => {
  const { token } = req.body;
  const { id } = req.user;

  try {
    let user = await MonobankUsers.getUserByToken({ token, userId: id });

    if (!user) {
      let response = await req.redisClient.get(token);

      if (!response) {
        await updateWebhook();

        response = (await axios({
          method: 'GET',
          url: `${hostname}/personal/client-info`,
          responseType: 'json',
          headers: {
            'X-Token': userToken,
          },
        })).data;

        await req.redisClient.set(userToken, JSON.stringify(response));
        await req.redisClient.expire(userToken, 60000);
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

    return res.status(404).json({ message: 'Account already connected', response: [] });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getUser = async (req, res, next) => {
  const { id } = req.user;

  try {
    const user = await MonobankUsers.getUser({
      systemUserId: id,
    });

    return res.status(200).json({ response: user });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getTransactions = async (req, res, next) => {
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
    });

    return res.status(200).json({ response: transactions });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getAccounts = async (req, res, next) => {
  const { id } = req.user;

  try {
    const monoUser = await MonobankUsers.getUser({ systemUserId: id });

    if (!monoUser) {
      return res.status(404).json({ status: 'error', message: 'Current user does not have any paired monobank user.' });
    }

    const accounts = await MonobankAccounts.getAccountsByUserId({
      monoUserId: monoUser.get('id'),
    });
    return res.status(200).json({ response: accounts });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.createAccounts = async (req, res, next) => {
  const {
    userId,
    accountsIds,
    token,
  } = req.body;

  try {
    let response = await req.redisClient.get(token);

    if (!response) {
      response = (await axios({
        method: 'GET',
        url: `${hostname}/personal/client-info`,
        responseType: 'json',
        headers: {
          'X-Token': userToken,
        },
      })).data;

      await req.redisClient.set(userToken, JSON.stringify(response));
      await req.redisClient.expire(userToken, 60000);
    } else {
      response = JSON.parse(response);
    }

    accountsIds.forEach((id) => {
      MonobankAccounts.createAccount({
        userId,
        accountId: id,
      });
    });

    return res.status(200).json({ response: [] });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.monobankWebhook = async (req, res, next) => {
  const { data } = req.body;

  try {
    const monobankAccount = await MonobankAccounts.getByAccountId({
      accountId: data.account,
    });
    if (!monobankAccount) {
      return res.status(404).json({ message: 'Monobank account does not exist!' });
    }
    await createMonoTransaction({
      data: data.statementItem,
      account: monobankAccount,
    });

    return res.status(200).json({ message: 'success' });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.updateWebhook = async (req, res, next) => {
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

      await updateWebhook();

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

exports.loadTransactions = async (req, res, next) => {
  try {
    const { from, to, accountId } = req.query;
    const { id: systemUserId } = req.user;

    // Check mono account exist
    const monobankAccount = await MonobankAccounts.getByAccountId({
      accountId,
    });

    if (!monobankAccount) {
      return res.status(404).json({ message: 'Monobank account does not exist.' });
    }

    // Check is there already created query for data retrieve
    const existQuery = usersQuery.get(`query-${systemUserId}`);

    if (existQuery) {
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
            'X-Token': userToken,
          },
        });

        // eslint-disable-next-line no-restricted-syntax
        for (const item of data) {
          // eslint-disable-next-line no-await-in-loop
          await createMonoTransaction({
            data: item,
            account: monobankAccount,
          });
        }
      });
    }

    // When all requests are done – delete it from the map
    queue.on('idle', () => {
      usersQuery.delete(`query-${systemUserId}`);
    });

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    return next(new Error(err));
  }
};
