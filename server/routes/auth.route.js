const { Router } = require('express');
const {
  login,
  register,
} = require('@controllers/auth.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.post('/login', [], validation, login);
  router.post('/register', [], validation, register);

  return router;
};
