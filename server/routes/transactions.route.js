const { Router } = require('express');
const passport = require('passport');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('@controllers/transactions.controller');

module.exports = () => {
  const router = Router({});

  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    getTransactions,
  );
  router.get(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    getTransactionById,
  );
  router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    createTransaction,
  );
  router.put(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    updateTransaction,
  );
  router.delete(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    deleteTransaction,
  );

  return router;
};
