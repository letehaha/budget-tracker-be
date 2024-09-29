'use strict';

const SECURITY_PRICINGS_NAME = 'SecurityPricings';
const SECURITIES_NAME = 'Securities';
const HOLDINGS_NAME = 'Holdings';
const INVESTMENT_TRANSACTIONS_NAME = 'InvestmentTransactions';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Creating the Securities table
      await queryInterface.createTable(
        SECURITIES_NAME,
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          symbol: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          cusip: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          isin: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          sharesPerContract: {
            type: Sequelize.DECIMAL(36, 18),
            allowNull: true,
          },
          currencyCode: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'USD',
          },
          cryptoCurrencyCode: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          pricingLastSyncedAt: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          isBrokerageCash: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          exchangeAcronym: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          exchangeMic: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          exchangeName: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          providerName: {
            type: Sequelize.ENUM('polygon', 'other'),
            allowNull: false,
            defaultValue: 'other',
          },
          assetClass: {
            type: Sequelize.ENUM('cash', 'crypto', 'fixed_income', 'options', 'stocks', 'other'),
            allowNull: false,
            defaultValue: 'other',
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );
      // Creating the Holdings table
      await queryInterface.createTable(
        HOLDINGS_NAME,
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          accountId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Accounts',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          securityId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: SECURITIES_NAME,
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          value: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: false,
          },
          refValue: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: false,
          },
          quantity: {
            type: Sequelize.DECIMAL(36, 18),
            allowNull: false,
          },
          costBasis: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: true,
          },
          refCostBasis: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: true,
          },
          currencyCode: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'USD',
          },
          excluded: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      // Creating the InvestmentTransactions table
      await queryInterface.createTable(
        INVESTMENT_TRANSACTIONS_NAME,
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          accountId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'Accounts',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          securityId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: SECURITIES_NAME,
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          transactionType: {
            type: Sequelize.STRING, // Adjusted type for simplicity
            allowNull: false,
            defaultValue: 'income',
          },
          date: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          amount: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: false,
          },
          refAmount: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: false,
          },
          fees: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: true,
          },
          quantity: {
            type: Sequelize.DECIMAL(36, 18),
            allowNull: false,
          },
          price: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: true,
          },
          refPrice: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: true,
          },
          currencyCode: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'USD',
          },
          category: {
            type: Sequelize.ENUM(
              'buy',
              'sell',
              'dividend',
              'transfer',
              'tax',
              'fee',
              'cancel',
              'other',
            ),
            allowNull: false,
            defaultValue: 'buy',
          },
          transferNature: {
            type: 'enum_transfer_nature',
            allowNull: false,
            defaultValue: 'not_transfer', // Replace with the actual default value from TRANSACTION_TRANSFER_NATURE
          },
          transferId: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      /**
       * Creating the SecurityPricings table.
       *
       * `securityId` and `date` are an composite primary key.
       */
      await queryInterface.createTable(
        SECURITY_PRICINGS_NAME,
        {
          securityId: {
            primaryKey: true,
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: SECURITIES_NAME,
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          date: {
            primaryKey: true,
            type: Sequelize.DATEONLY,
            allowNull: false,
          },
          priceClose: {
            type: Sequelize.DECIMAL(20, 10),
            allowNull: false,
          },
          priceAsOf: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          source: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
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

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable(HOLDINGS_NAME, { transaction });
      await queryInterface.dropTable(INVESTMENT_TRANSACTIONS_NAME, { transaction });
      await queryInterface.dropTable(SECURITY_PRICINGS_NAME, { transaction });
      await queryInterface.dropTable(SECURITIES_NAME, { transaction });

      await transaction.commit();
    } catch (err) {
      console.error(err);
      await transaction.rollback();
      throw err;
    }
  },
};
