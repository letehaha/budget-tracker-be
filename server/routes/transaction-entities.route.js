const { Router } = require('express');
const TransactionEntitiesController = require('@controllers/transaction-entities.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, TransactionEntitiesController.getTransactionEntities);

  return router;
};
