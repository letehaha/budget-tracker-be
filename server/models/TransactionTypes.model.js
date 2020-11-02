const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TransactionTypes extends Model {}

  TransactionTypes.init({
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
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  TransactionTypes.getTransactionTypes = async () => {
    const accountTypes = await TransactionTypes.findAll();

    return accountTypes;
  };

  return TransactionTypes;
};
