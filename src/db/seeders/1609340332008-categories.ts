import { QueryInterface } from 'sequelize';
import { CATEGORY_TYPES } from 'shared-types';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.bulkInsert('Categories', [
          {
            id: 1,
            name: 'Food & Drinks',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 2,
            name: 'Shopping',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 3,
            name: 'Housing',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 4,
            name: 'Transportation',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 5,
            name: 'Veniche',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 6,
            name: 'Life & Entertainment',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 7,
            name: 'Communication, PC',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 8,
            name: 'Financial expenses',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 9,
            name: 'Investments',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 10,
            name: 'Income',
            userId: 1,
            type: CATEGORY_TYPES.custom,
            color: '',
          },
          {
            id: 11,
            name: 'Other',
            userId: 1,
            type: CATEGORY_TYPES.internal,
            color: '',
          },
        ], { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.bulkDelete('Categories', null, { transaction });
      }
    )
  },
};
