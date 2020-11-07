const { Router } = require('express');
const TransactionTypesController = require('@controllers/transaction-types.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, TransactionTypesController.getTransactionTypes);

  return router;
};