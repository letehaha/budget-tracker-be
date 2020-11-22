const { Router } = require('express');
const { getAllCurrencies } = require('@controllers/currencies.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, getAllCurrencies);

  return router;
};
