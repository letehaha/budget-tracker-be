const { Router } = require('express');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('@controllers/transactions.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, getTransactions);
  router.get('/:id', [], validation, getTransactionById);
  router.post('/', [], validation, createTransaction);
  router.put('/:id', [], validation, updateTransaction);
  router.delete('/:id', [], validation, deleteTransaction);

  return router;
};
