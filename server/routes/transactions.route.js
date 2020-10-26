const { Router } = require('express');
const TransactionsController = require('@controllers/transactions.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, TransactionsController.getTransactions);

  return router;
};
