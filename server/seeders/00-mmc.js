const mccCodes = require('../resources/mcc-codes.json');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      'MerchantCategoryCodes',
      mccCodes.map((code) => ({
        code: code.mcc,
        name: code.edited_description,
        description: code.irs_description,
      })),
      {},
    );
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('MerchantCategoryCodes', null, {});
  },
};
