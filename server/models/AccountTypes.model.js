const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccountTypes extends Model {}

  AccountTypes.init({
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
  }, {
    sequelize,
    timestamps: false,
  });

  AccountTypes.getAccountTypes = async () => {
    const accountTypes = await AccountTypes.findAll();

    return accountTypes;
  };

  return AccountTypes;
};
