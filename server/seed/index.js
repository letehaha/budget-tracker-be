require('dotenv').config();
require('module-alias/register');
const mongoose = require('mongoose');
const accountTypes = require('./models/account-types.seed');
const currencies = require('./models/currencies.seed');
const paymentTypes = require('./models/payment-types.seed');
const transactionTypes = require('./models/transaction-types.seed');
const { seedTestAccount } = require('./account.seed');
const { seedTestTransaction } = require('./transaction.seed');
const { seedTestUsers } = require('./users.seed');

const DB_HOST = process.env.SERVICES_API_DB_HOST;
const DB_PORT = process.env.SERVICES_API_DB_PORT;
const DB_NAME = process.env.SERVICES_API_DB_NAME;

mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

mongoose.connection.once('open', async () => {
  const collections = (
    await mongoose.connection.db.listCollections().toArray()
  ).map((item) => item.name);

  await Promise.all(
    collections.map((collection) => mongoose.connection.db.dropCollection(collection)),
  );

  const seeds = [
    ...currencies,
    ...accountTypes,
    ...paymentTypes,
    ...transactionTypes,
  ];

  await Promise.all(seeds.map((seed) => seed.save()));

  await seedTestUsers();
  await seedTestAccount();
  await seedTestTransaction();

  mongoose.disconnect();
});
