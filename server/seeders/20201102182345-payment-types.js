module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('PaymentTypes', [
      { name: 'Bank transfer' },
      { name: 'Voucher' },
      { name: 'Web payment' },
      { name: 'Cash' },
      { name: 'Mobile payment' },
      { name: 'Credit card' },
      { name: 'Debit card' },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('PaymentTypes', null, {});
  },
};
