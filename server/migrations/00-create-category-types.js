module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CategoryTypes', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      iconUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('CategoryTypes');
  },
};
