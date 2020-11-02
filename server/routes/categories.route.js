const { Router } = require('express');
const CategoriesController = require('@controllers/categories.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, CategoriesController.getCategories);

  return router;
};
