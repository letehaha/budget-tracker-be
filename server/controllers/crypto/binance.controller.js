const { BinanceUserSettings } = require('@models');
const axios = require('axios').default;
// const CryptoJS = require('crypto-js');
const crypto = require('crypto');

const APIKEY = 'yim1bN6qIJVmJmRDSoyqYho3MKUCZJyA6ooHqTb7pZ2r1wdaxu7uAH8JEz5ShCd0';
const SECRET = 'W9BabeaggURiloV60r7Er3vIuy0bLLnA9crkJwqqQYd0ouPLERckDEvI7sUsJY1G';

const createSignedGETRequestURL = ({ url, params }) => {
  const localUrl = new URL(url);
  const localParams = params;

  localUrl.search = new URLSearchParams(localParams).toString();

  localParams.signature = crypto
    .createHmac('sha256', SECRET)
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
  const {
    timestamp = new Date().getTime(),
  } = req.query;

  try {
    const url = createSignedGETRequestURL({
      url: 'https://api.binance.com/api/v3/account',
      params: { timestamp },
    });

    const response = await axios({
      url: url.href,
      headers: {
        'X-MBX-APIKEY': APIKEY,
      },
      responseType: 'json',
      method: 'GET',
    });

    return res.status(200).json({ response: response.data });
  } catch (err) {
    return next(new Error(err));
  }
};
