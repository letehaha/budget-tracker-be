const { Router } = require('express');
const passport = require('passport');
const {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
} = require('@controllers/accounts.controller');

module.exports = () => {
  const router = Router({});

  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    getAccounts,
  );
  router.get(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    getAccountById,
  );
  router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    createAccount,
  );
  router.put(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    updateAccount,
  );
  router.delete(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    deleteAccount,
  );

  return router;
};
