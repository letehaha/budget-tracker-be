const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Accounts extends Model {
    static associate(models) {
      Accounts.belongsTo(models.AccountTypes, {
        foreignKey: 'accountTypeId',
      });
      Accounts.belongsTo(models.Currencies, {
        foreignKey: 'currencyId',
      });
    }
  }

  Accounts.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currentBalance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
    },
    creditLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  Accounts.getAccounts = async () => {
    const accounts = await Accounts.findAll();

    return accounts;
  };

  Accounts.getAccountById = async ({ id }) => {
    const account = await Accounts.findOne({ where: { id } });

    return account;
  };

  Accounts.createAccount = async ({
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
  }) => {
    const account = await Accounts.create({
      accountTypeId,
      currencyId,
      name,
      currentBalance,
      creditLimit,
    });

    return account;
  };

  Accounts.updateAccountById = async ({
    id,
    accountTypeId,
    currencyId,
    name,
    currentBalance,
    creditLimit,
  }) => {
    const where = { id };
    await Accounts.update(
      {
        accountTypeId,
        currencyId,
        name,
        currentBalance,
        creditLimit,
      },
      { where },
    );

    const account = await Accounts.findOne({ where });

    return account;
  };

  Accounts.deleteAccountById = async ({ id }) => {
    await Accounts.destroy({ where: { id } });
  };

  return Accounts;
};
