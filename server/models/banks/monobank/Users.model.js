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
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    webHookUrl: {
      type: DataTypes.STRING(1000),
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

  MonobankUsers.getUserByToken = async ({ token, userId }) => {
    const user = await MonobankUsers.findOne({
      where: { apiToken: token, systemUserId: userId },
    });

    return user;
  };

  MonobankUsers.getUser = async ({ systemUserId }) => {
    const user = await MonobankUsers.findOne({
      where: { systemUserId },
      attributes: ['id', 'clientId', 'name', 'webHookUrl', 'systemUserId', 'apiToken'],
    });

    return user;
  };

  MonobankUsers.getById = async ({ id }) => {
    const users = await MonobankUsers.findOne({ where: { id } });

    return users;
  };

  MonobankUsers.createUser = async ({
    userId,
    token,
    name,
    clientId,
    webHookUrl,
  }) => {
    await MonobankUsers.create({
      apiToken: token,
      clientId,
      name,
      webHookUrl,
      systemUserId: userId,
    });
    const user = await MonobankUsers.getUserByToken({ token, userId });

    return user;
  };

  MonobankUsers.updateWebhook = async ({
    webHookUrl,
    clientId,
    systemUserId,
  }) => {
    const result = await MonobankUsers.update(
      { webHookUrl },
      { where: { clientId, systemUserId } },
    );

    return result;
  };

  return MonobankUsers;
};
