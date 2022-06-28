module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Categories', [
      {
        id: 1,
        name: 'Food & Drinks',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 2,
        name: 'Shopping',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 3,
        name: 'Housing',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 4,
        name: 'Transportation',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 5,
        name: 'Veniche',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 6,
        name: 'Life & Entertainment',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 7,
        name: 'Communication, PC',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 8,
        name: 'Financial expenses',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 9,
        name: 'Investments',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 10,
        name: 'Income',
        userId: 1,
        type: 'custom',
        color: '',
      },
      {
        id: 11,
        name: 'Other',
        userId: 1,
        type: 'internal',
        color: '',
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Categories', null, {});
  },
};
