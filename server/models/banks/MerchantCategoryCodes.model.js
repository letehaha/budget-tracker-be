const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MerchantCategoryCodes extends Model {
    static associate(models) {
      MerchantCategoryCodes.belongsToMany(models.Categories, {
        through: 'UserMerchantCategoryCodes',
        as: 'categories',
        foreignKey: 'mccId',
      });
    }
  }

  MerchantCategoryCodes.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  MerchantCategoryCodes.getByCode = async ({
    code,
  }) => {
    const mcc = await MerchantCategoryCodes.findOne({
      where: { code },
    });

    return mcc;
  };

  MerchantCategoryCodes.addCode = async ({ code, name = 'Unknown', description }) => {
    const mcc = await MerchantCategoryCodes.create({
      code,
      name,
      description,
    });

    return mcc;
  };

  return MerchantCategoryCodes;
};
