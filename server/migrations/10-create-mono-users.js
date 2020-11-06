module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MonobankUsers', {
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
      webHookUrl: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      apiToken: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });

    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'MonobankUsers',
        'systemUserId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('MonobankUsers');

    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('MonobankUsers', 'systemUserId', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
