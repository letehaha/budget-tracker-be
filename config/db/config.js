const config = require('config').get('db');

const options = {
  username: config.user,
  password: config.password,
  database: config.database,
  host: config.host,
  dialect: config.dialect,
  port: config.port,
  migrationStorageTableName: 'SequelizeMeta',
};

module.exports = {
  development: options,
  test: options,
  staging: options,
  production: options,
};
