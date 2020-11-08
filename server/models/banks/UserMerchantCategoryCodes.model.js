const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserMerchantCategoryCodes extends Model {}

  UserMerchantCategoryCodes.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    mccId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  return UserMerchantCategoryCodes;
};
