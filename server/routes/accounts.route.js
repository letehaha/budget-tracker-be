const { Router } = require('express');
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} = require('@controllers/accounts.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, getAccounts);
  router.get('/:id', [], validation, getAccountById);
  router.post('/', [], validation, createAccount);
  router.put('/:id', [], validation, updateAccount);
  router.delete('/:id', [], validation, deleteAccount);

  return router;
};
