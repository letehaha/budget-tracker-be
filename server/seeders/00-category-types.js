const { CATEGORY_TYPES } = require('../js/const');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('CategoryTypes', [
      {
        type: CATEGORY_TYPES.food,
        color: '#ff0000',
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('CategoryTypes', null, {});
  },
};
