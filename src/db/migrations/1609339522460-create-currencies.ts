import  * as cc from 'currency-codes';
import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('Currencies', {
          id: {
            type: Sequelize.INTEGER,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          currency: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          digits: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          number: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          code: {
            type: Sequelize.STRING,
            allowNull: false,
          },
        }, { transaction });

        const uah = cc.number('980');
        const uahData = {
          code: uah.code,
          number: Number(uah.number),
          digits: uah.digits,
          currency: uah.currency,
        };

        await queryInterface.bulkInsert('Currencies', [
          uahData,
        ], { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('Currencies', { transaction });
      }
    )
  },
};
