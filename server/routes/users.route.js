const { Router } = require('express');
const passport = require('passport');
const { getUsers } = require('@controllers/users.controller');

module.exports = () => {
  const router = Router({});

  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    getUsers,
  );

  return router;
};
