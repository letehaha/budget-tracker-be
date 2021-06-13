const { BinanceUserSettings } = require('@models');
const axios = require('axios').default;
// const CryptoJS = require('crypto-js');
const crypto = require('crypto');

const createSignedGETRequestURL = ({ url, params, secretKey }) => {
  const localUrl = new URL(url);
  const localParams = params;

  localUrl.search = new URLSearchParams(localParams).toString();

  localParams.signature = crypto
    .createHmac('sha256', secretKey)
    .update(localUrl.search.substr(1))
    .digest('hex');

  localUrl.search = new URLSearchParams(localParams).toString();

  return localUrl;
};

exports.setSettings = async (req, res, next) => {
  const { id } = req.user;
  const {
    apiKey,
    secretKey,
  } = req.body;

  try {
    let settings = await BinanceUserSettings.addSettings({
      userId: id,
      apiKey,
      secretKey,
    });

    if (Array.isArray(settings)) {
      // eslint-disable-next-line prefer-destructuring
      settings = settings[0];
    }

    return res.status(200).json({ response: settings });
  } catch (err) {
    return next(new Error(err));
  }
};

exports.getAccountData = async (req, res, next) => {
  const { id } = req.user;
  const {
    timestamp = new Date().getTime(),
  } = req.query;

  try {
    const userSettings = await BinanceUserSettings.getByUserId({
      userId: id,
    });

    if (!userSettings || (!userSettings.apiKey && !userSettings.secretKey)) {
      return res
        .status(401)
        .json({ message: 'Secret and public keys are not exist!' });
    }
    if (!userSettings.apiKey) {
      return res
        .status(401)
        .json({ message: 'Api key does not exists!' });
    }
    if (!userSettings.secretKey) {
      return res
        .status(401)
        .json({ message: 'Secret key does not exists!' });
    }

    const url = createSignedGETRequestURL({
      url: 'https://api.binance.com/api/v3/account',
      params: { timestamp },
      secretKey: userSettings.secretKey,
    });

    const response = await axios({
      url: url.href,
      headers: {
        'X-MBX-APIKEY': userSettings.apiKey,
      },
      responseType: 'json',
      method: 'GET',
    });

    return res.status(200).json({ response: response.data });
  } catch (err) {
    if (err.response.data.code === -2014) {
      return res.status(401).json({ message: err.response.data.msg });
    }
    return next(new Error(err));
  }
};
