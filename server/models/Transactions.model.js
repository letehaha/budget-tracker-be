const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transactions extends Model {
    static associate(models) {
      Transactions.belongsTo(models.Users, {
        foreignKey: 'userId',
      });
      Transactions.belongsTo(models.TransactionTypes, {
        foreignKey: 'transactionTypeId',
      });
      Transactions.belongsTo(models.PaymentTypes, {
        foreignKey: 'paymentTypeId',
      });
      Transactions.belongsTo(models.Accounts, {
        foreignKey: 'accountId',
      });
      Transactions.belongsTo(models.Categories, {
        foreignKey: 'categoryId',
      });
    }
  }

  Transactions.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      default: DataTypes.NOW,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  Transactions.getTransactions = async () => {
    const transactions = await Transactions.findAll();

    return transactions;
  };

  Transactions.getTransactionById = async ({ id }) => {
    const transactions = await Transactions.findOne({ where: { id } });

    return transactions;
  };

  Transactions.createTransaction = async ({
    amount,
    note,
    time,
    userId,
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
  }) => {
    const transactions = await Transactions.create({
      amount,
      note,
      time,
      userId,
      transactionTypeId,
      paymentTypeId,
      accountId,
      categoryId,
    });

    return transactions;
  };

  Transactions.updateTransactionById = async ({
    id,
    amount,
    note,
    time,
    userId,
    transactionTypeId,
    paymentTypeId,
    accountId,
    categoryId,
  }) => {
    const where = { id };
    await Transactions.update(
      {
        amount,
        note,
        time,
        userId,
        transactionTypeId,
        paymentTypeId,
        accountId,
        categoryId,
      },
      { where },
    );

    const transaction = await Transactions.findOne({ where });

    return transaction;
  };

  Transactions.deleteTransactionById = async ({ id }) => {
    await Transactions.destroy({ where: { id } });
  };

  return Transactions;
};
