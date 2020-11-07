const { Router } = require('express');
const passport = require('passport');
const {
  pairAccount,
  getUsers,
  getAccounts,
  createAccounts,
} = require('@controllers/banks/monobank.controller');

module.exports = () => {
  const router = Router({});

  router.post(
    '/pair-user',
    passport.authenticate('jwt', { session: false }),
    pairAccount,
  );
  router.get(
    '/users',
    passport.authenticate('jwt', { session: false }),
    getUsers,
  );
  router.get(
    '/accounts',
    passport.authenticate('jwt', { session: false }),
    getAccounts,
  );
  router.post(
    '/select-accounts',
    passport.authenticate('jwt', { session: false }),
    createAccounts,
  );

  return router;
};