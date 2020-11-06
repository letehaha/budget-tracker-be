const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MonobankUsers extends Model {
    static associate(models) {
      MonobankUsers.belongsTo(models.Users, {
        foreignKey: 'systemUserId',
      });
    }
  }

  MonobankUsers.init({
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
    webHookUrl: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    apiToken: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: true,
  });

  return MonobankUsers;
};
