const { Router } = require('express');
const {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('@controllers/users.controller');
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

  router.get('/', [], validation, getUsers);
  router.get('/:id', [], validation, getUser);
  router.post('/', [], validation, createUser);
  router.put('/:id', [], validation, updateUser);
  router.delete('/:id', [], validation, deleteUser);

  router.get('/:userId/transactions', [], validation, getTransactions);
  router.get('/:userId/transactions/:id', [], validation, getTransactionById);
  router.post('/:userId/transactions', [], validation, createTransaction);
  router.put('/:userId/transactions/:id', [], validation, updateTransaction);
  router.delete('/:userId/transactions/:id', [], validation, deleteTransaction);

  return router;
};
