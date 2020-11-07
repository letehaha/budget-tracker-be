const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Currencies extends Model {
    static associate(models) {
      Currencies.belongsToMany(models.Users, {
        through: 'UsersCurrencies',
        as: 'users',
        foreignKey: 'currencyId',
      });
    }
  }

  Currencies.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    digits: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  Currencies.getCurrencies = async () => {
    const currencies = await Currencies.findAll();

    return currencies;
  };

  Currencies.create = async ({ code }) => {
    const currencies = await Currencies.findAll();

    return currencies;
  };

  return Currencies;
};
