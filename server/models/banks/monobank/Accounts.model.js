const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonobankAccounts extends Model {
    static associate(models) {
      MonobankAccounts.belongsTo(models.MonobankUsers, {
        foreignKey: 'monoUserId',
      });
      MonobankAccounts.belongsTo(models.Currencies, {
        foreignKey: 'currencyId',
      });
      MonobankAccounts.belongsTo(models.AccountTypes, {
        foreignKey: 'accountTypeId',
      });
    }
  }

  MonobankAccounts.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
    },
    creditLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
    },
    cashbackType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    maskedPan: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    iban: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      default: false,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
  });

  MonobankAccounts.createAccount = async ({
    monoUserId,
    currencyId,
    accountTypeId,
    accountId,
    balance,
    creditLimit,
    cashbackType,
    maskedPan,
    type,
    iban,
    isEnabled,
  }) => {
    const account = await MonobankAccounts.create({
      accountId,
      balance,
      creditLimit,
      currencyId,
      cashbackType,
      maskedPan,
      type,
      iban,
      monoUserId,
      accountTypeId,
      isEnabled,
    });

    return account;
  };

  MonobankAccounts.getByAccountId = async ({
    accountId,
  }) => {
    const account = await MonobankAccounts.findOne({
      where: { accountId },
    });

    return account;
  };

  return MonobankAccounts;
};
