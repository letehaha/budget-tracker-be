'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('RefundTransactions', {
      original_tx_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Transactions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      refund_tx_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'Transactions',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
    });

    await queryInterface.addIndex('RefundTransactions', ['original_tx_id']);
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('RefundTransactions', ['original_tx_id']);
    await queryInterface.dropTable('RefundTransactions');
  }
};
