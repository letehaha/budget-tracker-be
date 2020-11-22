const { Router } = require('express');
const passport = require('passport');
const {
  getUser,
  getUserCurrencies,
  updateUser,
  deleteUser,
} = require('@controllers/user.controller');

module.exports = () => {
  const router = Router({});

  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    getUser,
  );
  router.get(
    '/currencies',
    passport.authenticate('jwt', { session: false }),
    getUserCurrencies,
  );
  router.put(
    '/update',
    passport.authenticate('jwt', { session: false }),
    updateUser,
  );
  router.delete(
    '/delete',
    passport.authenticate('jwt', { session: false }),
    deleteUser,
  );

  return router;
};
