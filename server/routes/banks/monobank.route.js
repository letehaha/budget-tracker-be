const { Router } = require('express');
const passport = require('passport');
const {
  pairAccount,
  getUser,
  getTransactions,
  getAccounts,
  createAccounts,
  monobankWebhook,
  updateWebhook,
  loadTransactions,
  updateAccount,
} = require('@controllers/banks/monobank.controller');

module.exports = () => {
  const router = Router({});

  router.post(
    '/pair-user',
    passport.authenticate('jwt', { session: false }),
    pairAccount,
  );
  router.get(
    '/user',
    passport.authenticate('jwt', { session: false }),
    getUser,
  );
  router.get(
    '/transactions',
    passport.authenticate('jwt', { session: false }),
    getTransactions,
  );
  router.get(
    '/accounts',
    passport.authenticate('jwt', { session: false }),
    getAccounts,
  );
  router.post(
    '/account',
    passport.authenticate('jwt', { session: false }),
    updateAccount,
  );
  router.post(
    '/select-accounts',
    passport.authenticate('jwt', { session: false }),
    createAccounts,
  );
  router.post(
    '/webhook',
    monobankWebhook,
  );
  router.post(
    '/update-webhook',
    passport.authenticate('jwt', { session: false }),
    updateWebhook,
  );
  router.get(
    '/load-transactions',
    passport.authenticate('jwt', { session: false }),
    loadTransactions,
  );

  return router;
};
