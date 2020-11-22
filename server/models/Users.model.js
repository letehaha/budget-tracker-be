const { Model } = require('sequelize');

const DETAULT_TOTAL_BALANCE = 0;

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
      default: DETAULT_TOTAL_BALANCE,
    },
    defaultCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    sequelize,
    timestamps: false,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: {
        attributes: {},
      },
    },
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

  Users.getUserCurrencies = async ({ userId }) => {
    const user = await Users.findOne({
      where: { id: userId },
      include: [
        {
          model: sequelize.models.Currencies,
          as: 'currencies',
          // to remove the rows from the join table (i.e. 'UsersCurrencies' table) in the result set
          through: { attributes: [] },
        },
      ],
    });

    return user;
  };

  Users.getUserByCredentials = async ({ password, username, email }) => {
    const where = {};
    if (password) where.password = password;
    if (username) where.username = username;
    if (email) where.email = email;
    const user = await Users.scope('withPassword').findOne({ where });

    return user;
  };

  Users.createUser = async (
    {
      username,
      email,
      firstName,
      lastName,
      middleName,
      password,
      avatar,
      totalBalance = DETAULT_TOTAL_BALANCE,
    },
    {
      transaction,
    },
  ) => {
    const user = await Users.create(
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
      {
        transaction,
      },
    );

    return user;
  };

  Users.updateUserById = async (
    {
      id,
      username,
      email,
      firstName,
      lastName,
      middleName,
      avatar,
      totalBalance,
      defaultCategoryId,
    },
    { transaction },
  ) => {
    const where = { id };
    const updateFields = {};

    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (middleName) updateFields.middleName = middleName;
    if (avatar) updateFields.avatar = avatar;
    if (totalBalance) updateFields.totalBalance = totalBalance;
    if (defaultCategoryId) updateFields.defaultCategoryId = defaultCategoryId;

    await Users.update(updateFields, { where, transaction });

    const user = await Users.findOne({ where, transaction });

    return user;
  };

  Users.deleteUserById = async ({ id }) => {
    await Users.destroy({ where: { id } });
  };

  return Users;
};
