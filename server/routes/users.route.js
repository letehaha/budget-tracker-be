const { Router } = require('express');
const {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('@controllers/users.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, getUsers);
  router.get('/:id', [], validation, getUser);
  router.post('/', [], validation, createUser);
  router.put('/:id', [], validation, updateUser);
  router.delete('/:id', [], validation, deleteUser);

  return router;
};
