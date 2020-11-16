module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('Categories', [
      {
        name: 'Food & Drinks',
        categoryTypeId: 1,
        userId: 1,
      },
      {
        name: 'Life',
        categoryTypeId: 2,
        userId: 1,
      },
      {
        name: 'Other',
        categoryTypeId: 3,
        userId: 1,
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Categories', null, {});
  },
};
