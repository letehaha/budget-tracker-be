'use strict';

const SECURITIES_NAME = 'Securities';
const UNIQUE_SECURITIES_INDEX_NAME = 'unique_securities_symbol_exchangeMic';

const INVESTMENT_TRANSACTIONS_NAME = 'InvestmentTransactions';
const INVESTMENT_TRANSACTIONS_INDEX_NAME = 'investment_transactions_accountId_date';

const SECURITY_PRICINGS_NAME = 'SecurityPricings';
const SECURITY_PRICINGS_INDEX_NAME = 'security_pricing_name';

/**
 * For some reason it was not possible to include indexes creation inside the
 * same migration with tables creation. It threw 'relation "Securities" does not exist'
 */
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addConstraint(SECURITIES_NAME, {
        fields: ['symbol', 'exchangeMic'], // Columns to include in the unique constraint
        type: 'unique',
        name: UNIQUE_SECURITIES_INDEX_NAME,
        transaction,
      });

      await queryInterface.addIndex(
        INVESTMENT_TRANSACTIONS_NAME,
        {
          fields: ['accountId', 'date'],
          name: INVESTMENT_TRANSACTIONS_INDEX_NAME,
        },
        { transaction }
      );

      await queryInterface.addIndex(
        SECURITY_PRICINGS_NAME,
        {
          fields: ['date'],
          name: SECURITY_PRICINGS_INDEX_NAME,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeConstraint(
        SECURITIES_NAME,
        UNIQUE_SECURITIES_INDEX_NAME,
        { transaction },
      );
      await queryInterface.removeIndex(
        INVESTMENT_TRANSACTIONS_NAME,
        INVESTMENT_TRANSACTIONS_INDEX_NAME,
        { transaction },
      );
      await queryInterface.removeIndex(
        SECURITY_PRICINGS_NAME,
        SECURITY_PRICINGS_INDEX_NAME,
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  }
};
