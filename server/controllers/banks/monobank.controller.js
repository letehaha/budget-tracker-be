const axios = require('axios').default;
const config = require('config');

const hostname = config.get('bankIntegrations.monobank.apiEndpoint');
const userToken = config.get('bankIntegrations.monobank.apiToken');

exports.getAccounts = async (req, res, next) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${hostname}/personal/client-info`,
      responseType: 'json',
      headers: {
        'X-Token': userToken,
      },
    });

    return res.status(200).json({ response: response.data });
  } catch (err) {
    return next(new Error(err));
  }
};
