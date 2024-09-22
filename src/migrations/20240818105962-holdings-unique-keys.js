'use strict';

const HOLDINGS_NAME = 'Holdings';
const HOLDINGS_INDEX_NAME = 'unique_accountId_securityId';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint(HOLDINGS_NAME, {
      fields: ['accountId', 'securityId'], // Columns to include in the unique constraint
      type: 'unique',
      name: HOLDINGS_INDEX_NAME,
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint(HOLDINGS_NAME, HOLDINGS_INDEX_NAME);
  }
};
