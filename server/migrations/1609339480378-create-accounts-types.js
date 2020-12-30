module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AccountTypes', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('AccountTypes');
  },
};
