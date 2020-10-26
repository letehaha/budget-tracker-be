const { Router } = require('express');
const AccountTypesController = require('@controllers/models/account-types.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, AccountTypesController.getAccountTypes);

  return router;
};
