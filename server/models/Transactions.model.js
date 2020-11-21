const { Model } = require('sequelize');
const { isExist } = require('@js/helpers');

const prepareTXInclude = (
  sequelize,
  {
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  },
) => {
  let include = null;

  if (isExist(includeAll)) {
    include = { all: true, nested: isExist(nestedInclude) };
  } else {
    include = [];

    if (isExist(includeUser)) include.push({ model: sequelize.models.Users });
    if (isExist(includeTransactionType)) {
      include.push({ model: sequelize.models.TransactionTypes });
    }
    if (isExist(includePaymentType)) include.push({ model: sequelize.models.PaymentTypes });
    if (isExist(includeAccount)) include.push({ model: sequelize.models.Accounts });
    if (isExist(includeCategory)) include.push({ model: sequelize.models.Categories });
  }

  return include;
};

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

  Transactions.getTransactions = async ({
    userId,
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }) => {
    const include = prepareTXInclude(sequelize, {
      includeUser,
      includeTransactionType,
      includePaymentType,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    });

    const transactions = await Transactions.findAll({
      include,
      where: { userId },
    });

    return transactions;
  };

  Transactions.getTransactionById = async ({
    id,
    userId,
    includeUser,
    includeTransactionType,
    includePaymentType,
    includeAccount,
    includeCategory,
    includeAll,
    nestedInclude,
  }) => {
    const include = prepareTXInclude(sequelize, {
      includeUser,
      includeTransactionType,
      includePaymentType,
      includeAccount,
      includeCategory,
      includeAll,
      nestedInclude,
    });

    const transactions = await Transactions.findOne({
      where: { id, userId },
      include,
    });

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
    const response = await Transactions.create({
      amount,
      note,
      time,
      userId,
      transactionTypeId,
      paymentTypeId,
      accountId,
      categoryId,
    });

    const transaction = await Transactions.getTransactionById({
      id: response.get('id'),
      userId,
    });

    return transaction;
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

    const transaction = await Transactions.getTransactionById({ id, userId });

    return transaction;
  };

  Transactions.deleteTransactionById = async ({ id, userId }) => {
    await Transactions.destroy({ where: { id, userId } });
  };

  return Transactions;
};
