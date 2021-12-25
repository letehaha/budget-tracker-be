const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const salt = bcrypt.genSaltSync(10);

    await queryInterface.bulkInsert('Users', [
      {
        username: 'letehaha',
        password: bcrypt.hashSync('password', salt),
        defaultCategoryId: 11,
        totalBalance: 0,
      },
    ], {});
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
