const { Router } = require('express');
const passport = require('passport');
const CategoriesController = require('@controllers/categories.controller');

module.exports = () => {
  const router = Router({});

  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    CategoriesController.getCategories,
  );

  return router;
};
