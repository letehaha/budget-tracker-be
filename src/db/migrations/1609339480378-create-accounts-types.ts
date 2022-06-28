import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('AccountTypes', {
          id: {
            type: Sequelize.INTEGER,
            unique: true,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
        }, { transaction });

        await queryInterface.bulkInsert('AccountTypes', [
          { name: 'General' },
          { name: 'Cash' },
          { name: 'Current account' },
          { name: 'Credit card' },
          { name: 'Saving account' },
          { name: 'Bonus' },
          { name: 'Insurance' },
          { name: 'Investment' },
          { name: 'Loan' },
          { name: 'Mortgage' },
          { name: 'Account with overdraft' },
        ], { transaction });
      }
    )
  },
  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.dropTable('AccountTypes', { transaction });
      }
    )
  },
};
