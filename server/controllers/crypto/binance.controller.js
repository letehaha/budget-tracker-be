const { BinanceUserSettings } = require('@models');
const axios = require('axios').default;
// const CryptoJS = require('crypto-js');
const crypto = require('crypto');

const { ERROR_CODES } = require('../../js/const');

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

exports.getAccountData = async (req, res) => {
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
        .status(403)
        .json({
          message: 'Secret and public keys do not exist!',
          code: ERROR_CODES.cryptoBinanceBothAPIKeysDoesNotexist,
        });
    }
    if (!userSettings.apiKey) {
      return res
        .status(403)
        .json({
          message: 'Api key does not exist!',
          code: ERROR_CODES.cryptoBinancePublicAPIKeyNotDefined,
        });
    }
    if (!userSettings.secretKey) {
      return res
        .status(403)
        .json({
          message: 'Secret key does not exist!',
          code: ERROR_CODES.cryptoBinanceSecretAPIKeyNotDefined,
        });
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

    const notNullBalances = response.data.balances
      .filter((item) => (Number(item.free) + Number(item.locked)) > 0);

    const defaultAssetQuote = 'USDT';
    const blackList = ['USDT', 'NFT'];
    const zeroPrice = ['NFT'];

    // TODO: replace it with allSettled
    // TODO: add check "if rejected use BTC as default quote asset"
    const dollars = (await Promise.all(
      notNullBalances
        .filter((balance) => !blackList.includes(balance.asset))
        .map((balance) => axios({
          url: `https://api.binance.com/api/v3/ticker/price?symbol=${balance.asset}${defaultAssetQuote}`,
          method: 'GET',
          responseType: 'json',
        })),
    )).map((item) => item.data);

    dollars.forEach((dollar) => {
      const index = response.data.balances.findIndex((item) => item.asset === dollar.symbol.replace(defaultAssetQuote, ''));
      response.data.balances[index].usdPrice = dollar.price;
    });

    zeroPrice.forEach((value) => {
      const index = response.data.balances.findIndex((item) => item.asset === value);

      response.data.balances[index].usdPrice = 0;
    });

    return res.status(200).json({ response: response.data });
  } catch (err) {
    if (err.response.data.code === -2014) {
      return res.status(400).json({ message: err.response.data.msg });
    }
    return res.status(500).json({
      code: 1,
      message: 'Unexpected server error!',
    });
  }
};
