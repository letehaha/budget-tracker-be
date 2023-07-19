module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'Accounts',
        'externalId',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Accounts',
        'externalData',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Accounts',
        'isEnabled',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transaction },
      );
      await queryInterface.removeColumn('Accounts', 'internal', { transaction });
      await queryInterface.addColumn('Accounts', 'type', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'system',
      }, { transaction });

      await queryInterface.renameColumn(
        'Transactions',
        'authorId',
        'userId',
        { transaction },
      );
      await queryInterface.addColumn(
        'Transactions',
        'originalId',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Transactions',
        'externalData',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Transactions',
        'commissionRate',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Transactions',
        'refCommissionRate',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Transactions',
        'cashbackAmount',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('Accounts', 'type', { transaction });
      await queryInterface.addColumn('Accounts', 'internal', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, { transaction });
      await queryInterface.removeColumn('Accounts', 'externalId', { transaction });
      await queryInterface.removeColumn('Accounts', 'isEnabled', { transaction });
      await queryInterface.removeColumn('Accounts', 'externalData', { transaction });

      await queryInterface.renameColumn('Transactions', 'userId', 'authorId', { transaction });
      await queryInterface.removeColumn('Transactions', 'originalId', { transaction });
      await queryInterface.removeColumn('Transactions', 'externalData', { transaction });
      await queryInterface.removeColumn('Transactions', 'commissionRate', { transaction });
      await queryInterface.removeColumn('Transactions', 'refCommissionRate', { transaction });
      await queryInterface.removeColumn('Transactions', 'cashbackAmount', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
