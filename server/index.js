require('dotenv').config();
require('module-alias/register');
const config = require('config');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const locale = require('locale');

/**
 *  Routes
 * */
const usersRoutes = require('@routes/users.route');
const accountsRoutes = require('@routes/accounts.route');
const transactionsRoutes = require('@routes/transactions.route');
const modelsAccountTypesRoutes = require('@routes/account-types.route');
const modelsCategoriesRoutes = require('@routes/categories.route');
const modelsCurrenciesRoutes = require('@routes/currencies.route');
const modelsPaymentTypesRoutes = require('@routes/payment-types.route');
const modelsTransactionTypesRoutes = require('@routes/transaction-types.route');
const monobankRoutes = require('@routes/banks/monobank.route');

const { supportedLocales } = require('./translations');

const app = express();

const apiPrefix = config.get('apiPrefix');

app.set('port', config.get('port'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(locale(supportedLocales));

/**
 *  Routes include
 * */
app.use(`${apiPrefix}/users`, usersRoutes());
app.use(`${apiPrefix}/accounts`, accountsRoutes());
app.use(`${apiPrefix}/transactions`, transactionsRoutes());
app.use(`${apiPrefix}/models/account-types`, modelsAccountTypesRoutes());
app.use(`${apiPrefix}/models/categories`, modelsCategoriesRoutes());
app.use(`${apiPrefix}/models/currencies`, modelsCurrenciesRoutes());
app.use(`${apiPrefix}/models/payment-types`, modelsPaymentTypesRoutes());
app.use(`${apiPrefix}/models/transaction-types`, modelsTransactionTypesRoutes());
app.use(`${apiPrefix}/banks/monobank`, monobankRoutes());

app.listen(app.get('port'), () => {
  // eslint-disable-next-line no-console
  console.log(`[OK] Server is running on localhost:${app.get('port')}`);
});
