const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('config');

const basename = path.basename(__filename);

const db = {};

const sequelize = new Sequelize(
  config.get('db.database'),
  config.get('db.user'),
  config.get('db.password'),
  config.get('db'),
);

const modelsPaths = [
  '@models/banks/monobank/Accounts.model',
  '@models/banks/monobank/Users.model',
  '@models/banks/monobank/Transactions.model',
  '@models/banks/MerchantCategoryCodes.model',
  '@models/banks/UserMerchantCategoryCodes.model',
];

fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

modelsPaths.forEach((filePath) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const model = require(filePath)(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
