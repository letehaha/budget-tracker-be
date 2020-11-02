const { Router } = require('express');
const PaymentTypesController = require('@controllers/payment-types.controller');
const validation = require('@middlewares/validations');

module.exports = () => {
  const router = Router({});

  router.get('/', [], validation, PaymentTypesController.getPaymentTypes);

  return router;
};
