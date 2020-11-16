const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categories extends Model {
    static associate(models) {
      Categories.belongsTo(models.CategoryTypes, {
        foreignKey: 'categoryTypeId',
      });
      Categories.belongsTo(models.Users, {
        foreignKey: 'userId',
      });
      Categories.belongsToMany(models.MerchantCategoryCodes, {
        through: 'UserMerchantCategoryCodes',
        as: 'merchantCodes',
        foreignKey: 'categoryId',
      });
    }
  }

  Categories.init({
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
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  Categories.getCategories = async () => {
    const categories = await Categories.findAll();

    return categories;
  };

  return Categories;
};
