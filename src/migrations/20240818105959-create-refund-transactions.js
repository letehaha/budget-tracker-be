'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable(
        'RefundTransactions',
        {
          id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
          },
          original_tx_id: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Transactions',
              key: 'id',
            },
            onDelete: 'SET NULL',
          },
          refund_tx_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
            references: {
              model: 'Transactions',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
          createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
          updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
        },
        { transaction },
      );

      await queryInterface.addIndex('RefundTransactions', ['original_tx_id'], { transaction });
      await queryInterface.addIndex('RefundTransactions', ['refund_tx_id'], {
        unique: true,
        transaction,
      });

      // Add has_refund column to Transactions table
      await queryInterface.addColumn(
        'Transactions',
        'refundLinked',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
      await queryInterface.removeIndex('RefundTransactions', ['original_tx_id'], { transaction });
      await queryInterface.removeIndex('RefundTransactions', ['refund_tx_id'], { transaction });
      await queryInterface.dropTable('RefundTransactions', { transaction });

      await queryInterface.removeColumn('Transactions', 'refundLinked', { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
