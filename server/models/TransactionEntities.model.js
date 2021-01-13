const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TransactionEntities extends Model {}

  TransactionEntities.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  TransactionEntities.getTransactionEntities = async () => {
    const result = await TransactionEntities.findAll();

    return result;
  };

  TransactionEntities.getTransactionEntityByType = async ({ type }) => {
    const result = await TransactionEntities.findOne({ where: { type } });

    return result;
  };

  return TransactionEntities;
};
