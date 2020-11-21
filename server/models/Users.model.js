const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
      Users.hasMany(models.Accounts, {
        onDelete: 'cascade',
      });
      Users.belongsToMany(models.Currencies, {
        through: 'UsersCurrencies',
        as: 'currencies',
        foreignKey: 'userId',
      });
    }
  }

  Users.init({
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    totalBalance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 0,
    },
    defaultCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    timestamps: false,
  });

  Users.getUsers = async () => {
    const users = await Users.findAll();

    return users;
  };

  Users.getUserById = async ({ id }) => {
    const user = await Users.findOne({ where: { id } });

    return user;
  };

  Users.getUserDefaultCategory = async ({ id }) => {
    const user = await Users.findOne({
      where: { id },
      attributes: ['defaultCategoryId'],
    });

    return user;
  };

  Users.getUserByCredentials = async ({ password, username, email }) => {
    const where = {};
    if (password) where.password = password;
    if (username) where.username = username;
    if (email) where.email = email;
    const user = await Users.findOne({ where });

    return user;
  };

  Users.createUser = async ({
    username,
    email,
    firstName,
    lastName,
    middleName,
    password,
    avatar,
    totalBalance,
  }) => {
    const user = await Users.create({
      username,
      email,
      firstName,
      lastName,
      middleName,
      password,
      avatar,
      totalBalance,
    });

    return user;
  };

  Users.updateUserById = async ({
    id,
    username,
    email,
    firstName,
    lastName,
    middleName,
    password,
    avatar,
    totalBalance,
  }) => {
    const where = { id };
    await Users.update(
      {
        username,
        email,
        firstName,
        lastName,
        middleName,
        password,
        avatar,
        totalBalance,
      },
      { where },
    );

    const user = await Users.findOne({ where });

    return user;
  };

  Users.deleteUserById = async ({ id }) => {
    await Users.destroy({ where: { id } });
  };

  return Users;
};
