const { Router } = require('express');
const CurrenciesController = require('@controllers/currencies.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, CurrenciesController.getCurrencies);

  return router;
};