module.exports = {
  name: 'budget-tracker-be',
  env: 'development',
  envShort: 'dev',
  host: process.env.SERVICES_API_HOST,
  port: process.env.SERVICES_API_PORT,
  apiPrefix: process.env.SERVICES_API_PREFIX,
  db: {
    host: process.env.SERVICES_API_DB_HOST,
    user: process.env.SERVICES_API_DB_USER,
    password: process.env.SERVICES_API_DB_PASS,
    database: process.env.SERVICES_API_DB_NAME,
    port: process.env.SERVICES_API_DB_PORT,
    dialect: process.env.SERVICES_API_DB_DIALECT,
    logging: false,
  },
};
