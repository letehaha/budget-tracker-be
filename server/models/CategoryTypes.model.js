const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CategoryTypes extends Model {}

  CategoryTypes.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    iconUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  return CategoryTypes;
};
