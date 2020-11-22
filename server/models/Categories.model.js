const { Model } = require('sequelize');
const { CATEGORY_TYPES } = require('@js/const');

module.exports = (sequelize, DataTypes) => {
  class Categories extends Model {
    static associate(models) {
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
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(Object.values(CATEGORY_TYPES)),
      allowNull: false,
      default: CATEGORY_TYPES.custom,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  Categories.getCategories = async ({ id }) => {
    const categories = await Categories.findAll({ where: { userId: id } });

    return categories;
  };

  Categories.createCategory = async ({
    name,
    imageUrl,
    color,
    type = CATEGORY_TYPES.custom,
    parentId,
    userId,
  }) => {
    if (parentId) {
      const parent = await Categories.findOne({ where: { id: parentId, userId } });

      if (!parent) {
        throw new Error({
          message: "Category with such parentId doesn't exist",
          statusCode: 404,
        });
      }
    }

    const category = await Categories.create({
      name,
      imageUrl,
      color,
      type,
      parentId,
      userId,
    });

    return category;
  };

  return Categories;
};
