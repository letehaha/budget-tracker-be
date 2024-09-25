'use strict';

const INVESTMENT_TRANSACTIONS_NAME = 'InvestmentTransactions';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn(
        INVESTMENT_TRANSACTIONS_NAME,
        'refFees',
        {
          type: Sequelize.DECIMAL(20, 10),
          allowNull: true,
        },
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn(INVESTMENT_TRANSACTIONS_NAME, 'refFees', { transaction });
      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
};
