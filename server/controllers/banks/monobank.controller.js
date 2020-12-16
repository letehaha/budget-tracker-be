const axios = require('axios').default;
const config = require('config');

const {
  MonobankUsers,
  MonobankAccounts,
  MonobankTransactions,
  Currencies,
  MerchantCategoryCodes,
  UserMerchantCategoryCodes,
  Users,
} = require('@models');

const hostWebhooksCallback = config.get('hostWebhooksCallback');
const apiPrefix = config.get('apiPrefix');
const hostname = config.get('bankIntegrations.monobank.apiEndpoint');
const userToken = config.get('bankIntegrations.monobank.apiToken');

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

exports.getUsers = async (req, res, next) => {
  const { id } = req.user;

  try {
    const users = await MonobankUsers.getUsers({
      systemUserId: id,
    });

    return res.status(200).json({ response: users });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getAccounts = async (req, res, next) => {
  try {
    let response = await req.redisClient.get(userToken);

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
      await req.redisClient.expire(userToken, 60);
    } else {
      response = JSON.parse(response);
    }

    return res.status(200).json({ response });
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
    const userData = await MonobankUsers.getById({
      id: monobankAccount.get('monoUserId'),
    });

    const mccId = await MerchantCategoryCodes.getByCode({
      code: data.statementItem.mcc,
    });

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
      id: data.statementItem.id,
      description: data.statementItem.description,
      amount: data.statementItem.amount,
      time: new Date(data.statementItem.time * 1000),
      operationAmount: data.statementItem.operationAmount,
      commissionRate: data.statementItem.commissionRate,
      cashbackAmount: data.statementItem.cashbackAmount,
      balance: data.statementItem.balance,
      hold: data.statementItem.hold,
      monoAccountId: monobankAccount.get('id'),
      userId: userData.get('systemUserId'),
      transactionTypeId: data.statementItem.amount > 0 ? 1 : 2,
      paymentTypeId: 6,
      categoryId,
    });

    // eslint-disable-next-line no-console
    console.log(`New MONOBANK transaction! Amount is ${data.statementItem.amount}`);

    return res.status(200).json({ message: 'success' });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.updateWebhook = async (req, res, next) => {
  try {
    const { clientId } = req.body;
    const { id } = req.user;

    await MonobankUsers.updateWebhook({
      systemUserId: id,
      clientId,
      webHookUrl: `${hostWebhooksCallback}${apiPrefix}/banks/monobank/webhook`,
    });

    await updateWebhook();

    return res.status(200).json({ response: [] });
  } catch (err) {
    return next(new Error(err));
  }
};
