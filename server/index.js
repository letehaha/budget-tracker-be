require('dotenv').config();
require('module-alias/register');
const config = require('config');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const locale = require('locale');
const redis = require('redis');
const passport = require('passport');
const { promisify } = require('util');

/**
 *  Routes
 * */
const authRoutes = require('@routes/auth.route');
const usersRoutes = require('@routes/users.route');
const userRoutes = require('@routes/user.route');
const accountsRoutes = require('@routes/accounts.route');
const transactionsRoutes = require('@routes/transactions.route');
const modelsAccountTypesRoutes = require('@routes/account-types.route');
const сategoriesRoutes = require('@routes/categories.route');
const modelsCurrenciesRoutes = require('@routes/currencies.route');
const modelsPaymentTypesRoutes = require('@routes/payment-types.route');
const modelsTransactionTypesRoutes = require('@routes/transaction-types.route');
const monobankRoutes = require('@routes/banks/monobank.route');

const { supportedLocales } = require('./translations');

const app = express();
const apiPrefix = config.get('apiPrefix');
const redisClient = redis.createClient({
  host: config.get('redis.host'),
});

redisClient.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
});

['get', 'set', 'del', 'expire'].forEach((item) => {
  redisClient[item] = promisify(redisClient[item]);
});

app.use((req, res, next) => {
  req.redisClient = redisClient;
  next();
});

app.use(passport.initialize());
require('@middlewares/passport')(passport);

app.set('port', config.get('port'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(locale(supportedLocales));

/**
 *  Routes include
 * */
app.use(`${apiPrefix}/auth`, authRoutes());
app.use(`${apiPrefix}/user`, userRoutes());
app.use(`${apiPrefix}/users`, usersRoutes());
app.use(`${apiPrefix}/accounts`, accountsRoutes());
app.use(`${apiPrefix}/transactions`, transactionsRoutes());
app.use(`${apiPrefix}/categories`, сategoriesRoutes());
app.use(`${apiPrefix}/models/account-types`, modelsAccountTypesRoutes());
app.use(`${apiPrefix}/models/currencies`, modelsCurrenciesRoutes());
app.use(`${apiPrefix}/models/payment-types`, modelsPaymentTypesRoutes());
app.use(`${apiPrefix}/models/transaction-types`, modelsTransactionTypesRoutes());
app.use(`${apiPrefix}/banks/monobank`, monobankRoutes());

app.listen(app.get('port'), () => {
  // eslint-disable-next-line no-console
  console.log(`[OK] Server is running on localhost:${app.get('port')}`);
});
