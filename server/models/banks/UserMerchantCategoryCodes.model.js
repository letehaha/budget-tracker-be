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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  UserMerchantCategoryCodes.getByPassedParams = async ({
    mccId,
    userId,
    categoryId,
  }) => {
    const where = {};

    if (mccId) where.mccId = mccId;
    if (userId) where.userId = userId;
    if (categoryId) where.categoryId = categoryId;

    const mcc = await UserMerchantCategoryCodes.findAll({ where });

    return mcc;
  };

  UserMerchantCategoryCodes.createEntry = async ({
    mccId,
    userId,
    categoryId,
  }) => {
    const userMcc = await UserMerchantCategoryCodes.create({
      mccId,
      userId,
      categoryId,
    });

    return userMcc;
  };

  return UserMerchantCategoryCodes;
};
