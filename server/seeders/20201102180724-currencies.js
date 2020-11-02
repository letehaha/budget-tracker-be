const cc = require('currency-codes');

module.exports = {
  up: async (queryInterface) => {
    const uah = cc.number(980);
    const uahData = {
      code: uah.code,
      number: Number(uah.number),
      digits: uah.digits,
      currency: uah.currency,
    };

    await queryInterface.bulkInsert('Currencies', [
      uahData,
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Currencies', null, {});
  },
};
