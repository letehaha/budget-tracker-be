const { CATEGORY_TYPES } = require('../js/const');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('CategoryTypes', [
      {
        type: CATEGORY_TYPES.food,
        color: '#ff0000',
      },
      {
        type: CATEGORY_TYPES.life,
        color: 'blue',
      },
      {
        type: CATEGORY_TYPES.other,
        color: '#ccc',
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('CategoryTypes', null, {});
  },
};
