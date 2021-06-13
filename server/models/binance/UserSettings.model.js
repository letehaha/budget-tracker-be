const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BinanceUserSettings extends Model {
    static associate(models) {
      BinanceUserSettings.belongsTo(models.Users, {
        foreignKey: 'userId',
      });
    }
  }

  BinanceUserSettings.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    secretKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  BinanceUserSettings.getByUserId = async ({
    userId,
  }) => {
    const mcc = await BinanceUserSettings.findOne({
      where: { userId },
    });

    return mcc;
  };

  BinanceUserSettings.addSettings = async ({ apiKey, secretKey, userId }) => {
    const settingsData = {};

    if (apiKey) settingsData.apiKey = apiKey;
    if (secretKey) settingsData.secretKey = secretKey;

    let userSettings = await BinanceUserSettings.findOne({ where: { userId } });

    if (userSettings) {
      const result = await BinanceUserSettings.update(
        settingsData,
        {
          where: { userId },
          returning: true,
        },
      );
      if (result[1]) {
        // eslint-disable-next-line prefer-destructuring
        userSettings = result[1];
      }
    } else {
      userSettings = await BinanceUserSettings.create({
        ...settingsData,
        userId,
      });
    }

    console.log(userSettings);

    return userSettings;
  };

  return BinanceUserSettings;
};
