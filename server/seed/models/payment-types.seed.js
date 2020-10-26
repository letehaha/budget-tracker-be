const PaymentType = require('@models/PaymentType');

module.exports = [
  new PaymentType({
    name: 'Bank transfer',
  }),
  new PaymentType({
    name: 'Voucher',
  }),
  new PaymentType({
    name: 'Web payment',
  }),
  new PaymentType({
    name: 'Cash',
  }),
  new PaymentType({
    name: 'Mobile payment',
  }),
  new PaymentType({
    name: 'Credit card',
  }),
  new PaymentType({
    name: 'Debit card',
  }),
];
