const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UsersCurrencies extends Model {}

  UsersCurrencies.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  return UsersCurrencies;
};
