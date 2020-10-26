const { Router } = require('express');
const AccountsController = require('@controllers/accounts.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, AccountsController.getAccounts);

  return router;
};
