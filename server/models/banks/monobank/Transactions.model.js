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
    if (isExist(includeAccount)) include.push({ model: sequelize.models.MonobankAccounts });
    if (isExist(includeCategory)) include.push({ model: sequelize.models.Categories });
  }

  return include;
};

module.exports = (sequelize, DataTypes) => {
  class MonobankTransactions extends Model {
    static associate(models) {
      MonobankTransactions.belongsTo(models.Users, {
        foreignKey: 'userId',
      });
      MonobankTransactions.belongsTo(models.Categories, {
        foreignKey: 'categoryId',
      });
      MonobankTransactions.belongsTo(models.TransactionTypes, {
        foreignKey: 'transactionTypeId',
      });
      MonobankTransactions.belongsTo(models.PaymentTypes, {
        foreignKey: 'paymentTypeId',
      });
      MonobankTransactions.belongsTo(models.MonobankAccounts, {
        foreignKey: 'monoAccountId',
      });
    }
  }

  MonobankTransactions.init({
    id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
    },
    description: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      default: DataTypes.NOW,
    },
    operationAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    commissionRate: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cashbackAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hold: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  MonobankTransactions.getTransactions = async ({
    systemUserId,
    sortDirection,
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

    const transactions = await MonobankTransactions.findAll({
      include,
      where: { userId: systemUserId },
      order: [['time', sortDirection.toUpperCase()]],
    });

    return transactions;
  };

  MonobankTransactions.getTransactionById = async ({
    id,
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

    const transactions = await MonobankTransactions.findOne({ where: { id }, include });

    return transactions;
  };

  MonobankTransactions.createTransaction = async ({
    id,
    description,
    amount,
    time,
    operationAmount,
    commissionRate,
    cashbackAmount,
    balance,
    hold,
    userId,
    transactionTypeId,
    paymentTypeId,
    monoAccountId,
    categoryId,
  }) => {
    const tx = await MonobankTransactions.getTransactionById({ id });

    if (tx) {
      throw new Error('Transactions with such id already exist!');
    }

    const response = await MonobankTransactions.create({
      id,
      description,
      amount,
      time,
      operationAmount,
      commissionRate,
      cashbackAmount,
      balance,
      hold,
      userId,
      transactionTypeId,
      paymentTypeId,
      monoAccountId,
      categoryId,
    });

    const transaction = await MonobankTransactions.getTransactionById({ id: response.get('id') });

    return transaction;
  };

  MonobankTransactions.updateTransactionById = async ({
    id,
    description,
    amount,
    time,
    operationAmount,
    commissionRate,
    cashbackAmount,
    balance,
    hold,
    userId,
    transactionTypeId,
    paymentTypeId,
    monoAccountId,
    categoryId,
  }) => {
    const where = { id };
    await MonobankTransactions.update(
      {
        description,
        amount,
        time,
        operationAmount,
        commissionRate,
        cashbackAmount,
        balance,
        hold,
        userId,
        transactionTypeId,
        paymentTypeId,
        monoAccountId,
        categoryId,
      },
      { where },
    );

    const transaction = await MonobankTransactions.getTransactionById({ id });

    return transaction;
  };

  MonobankTransactions.deleteTransactionById = async ({ id }) => {
    await MonobankTransactions.destroy({ where: { id } });
  };

  return MonobankTransactions;
};
