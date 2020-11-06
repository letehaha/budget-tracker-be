const { Router } = require('express');
const {
  getAccounts,
} = require('@controllers/banks/monobank.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/accounts', [], validation, getAccounts);

  return router;
};
