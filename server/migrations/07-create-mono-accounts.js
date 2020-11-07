module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MonobankAccounts', {
      id: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      accountId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      balance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0,
      },
      creditLimit: {
        type: Sequelize.INTEGER,
        allowNull: false,
        default: 0,
      },
      cashbackType: {
        type: Sequelize.ENUM('UAH', 'Miles'),
        allowNull: true,
      },
      maskedPan: {
        type: Sequelize.STRING(1000),
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      iban: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isEnabled: {
        type: Sequelize.BOOLEAN,
        default: false,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
    });

    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'MonobankAccounts',
        'accountTypeId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'AccountTypes',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'MonobankAccounts',
        'currencyId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Currencies',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'MonobankAccounts',
        'monoUserId',
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
    await queryInterface.dropTable('MonobankAccounts');

    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('MonobankAccounts', 'accountTypeId', { transaction });
      await queryInterface.removeColumn('MonobankAccounts', 'currencyId', { transaction });
      await queryInterface.removeColumn('MonobankAccounts', 'monoUserId', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
