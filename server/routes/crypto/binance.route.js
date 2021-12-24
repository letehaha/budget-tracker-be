const { Router } = require('express');
const passport = require('passport');
const {
  getAccountData,
  setSettings,
} = require('@controllers/crypto/binance.controller');

module.exports = () => {
  const router = Router({});

  router.get(
    '/account',
    passport.authenticate('jwt', { session: false }),
    getAccountData,
  );
  router.post(
    '/set-settings',
    passport.authenticate('jwt', { session: false }),
    setSettings,
  );

  return router;
};
