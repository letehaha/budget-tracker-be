const axios = require('axios').default;
const config = require('config');

const { MonobankUsers, MonobankAccounts, Currencies } = require('@models');

const hostname = config.get('bankIntegrations.monobank.apiEndpoint');
const userToken = config.get('bankIntegrations.monobank.apiToken');

exports.pairAccount = async (req, res, next) => {
  const { token } = req.body;
  const { id } = req.user;

  try {
    let user = await MonobankUsers.getUserByToken({ token, userId: id });

    if (!user) {
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
          monoUserId: response.id,
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
