const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PaymentTypes extends Model {}

  PaymentTypes.init({
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

  PaymentTypes.getPaymentTypes = async () => {
    const accountTypes = await PaymentTypes.findAll();

    return accountTypes;
  };

  return PaymentTypes;
};
