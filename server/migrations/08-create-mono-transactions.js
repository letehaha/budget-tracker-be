module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MonobankTransactions', {
      id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
        primaryKey: true,
      },
      description: {
        type: Sequelize.STRING(2000),
        allowNull: true,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      operationAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      commissionRate: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cashbackAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      balance: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      hold: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      receiptId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });

    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        'MonobankTransactions',
        'userId',
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
      await queryInterface.addColumn(
        'MonobankTransactions',
        'categoryId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Categories',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'MonobankTransactions',
        'transactionTypeId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'TransactionTypes',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'MonobankTransactions',
        'paymentTypeId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'PaymentTypes',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'MonobankTransactions',
        'monoAccountId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'MonobankAccounts',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'MonobankTransactions',
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
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('MonobankTransactions');

    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('MonobankTransactions', 'userId', { transaction });
      await queryInterface.removeColumn('MonobankTransactions', 'transactionTypeId', { transaction });
      await queryInterface.removeColumn('MonobankTransactions', 'paymentTypeId', { transaction });
      await queryInterface.removeColumn('MonobankTransactions', 'monoAccountId', { transaction });
      await queryInterface.removeColumn('MonobankTransactions', 'categoryId', { transaction });
      await queryInterface.removeColumn('MonobankTransactions', 'currencyId', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
