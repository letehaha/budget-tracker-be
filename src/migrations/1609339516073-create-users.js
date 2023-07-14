const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      middleName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      avatar: {
        type: Sequelize.STRING(2000),
        allowNull: true,
      },
      totalBalance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      defaultCategoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });

    if (process.env.NODE_ENV === 'test') {
      await queryInterface.bulkInsert('Users', [
        {
          username: 'test1',
          password: bcrypt.hashSync('test1', salt),
        },
        {
          username: 'test2',
          password: bcrypt.hashSync('test2', salt),
        },
      ]);
      console.log(`Inserted users:
        username: test1;
        password: test1;
        &
        username: test2;
        password: test2
      `)
    }
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Users');
  },
};
