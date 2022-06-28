import { QueryInterface } from 'sequelize';
import * as mccCodes from '../../resources/mcc-codes.json';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('MerchantCategoryCodes', {
          id: {
            type: Sequelize.INTEGER,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          code: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING(1000),
            allowNull: true,
          },
        }, { transaction });

        await queryInterface.bulkInsert(
          'MerchantCategoryCodes',
          mccCodes.map((code) => ({
            code: code.mcc,
            name: code.edited_description,
            description: code.irs_description,
          })),
          { transaction },
        );
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('MerchantCategoryCodes', { transaction });
      }
    )
  },
};
