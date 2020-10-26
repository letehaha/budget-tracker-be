const cc = require('currency-codes');
const Currency = require('@models/Currency');

module.exports = [
  new Currency(cc.number(840)),
  new Currency(cc.number(978)),
  new Currency(cc.number(980)),
];
