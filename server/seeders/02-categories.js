require('module-alias/register');

const { CATEGORY_TYPES } = require('@js/const');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Categories', [
      {
        name: 'Food & Drinks',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Shopping',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Housing',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Transportation',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Veniche',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Life & Entertainment',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Communication, PC',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Financial expenses',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Investments',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Income',
        userId: 1,
        type: CATEGORY_TYPES.custom,
        color: '',
      },
      {
        name: 'Other',
        userId: 1,
        type: CATEGORY_TYPES.internal,
        color: '',
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Categories', null, {});
  },
};
