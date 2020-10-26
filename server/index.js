require('dotenv').config()
require('module-alias/register')
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const locale = require('locale');
const { supportedLocales } = require('./translations');

/**
 *  Routes
 * */
const accountsRoutes = require('@routes/accounts.route');
const modelsAccountTypesRoutes = require('@routes/models/account-types.route');
const modelsCategoriesRoutes = require('@routes/models/categories.route');
const modelsCurrenciesRoutes = require('@routes/models/currencies.route');
const modelsPaymentTypesRoutes = require('@routes/models/payment-types.route');
const modelsTransactionTypesRoutes = require('@routes/models/transaction-types.route');

const app = express();

const apiPrefix = '/api/v1'

const DB_HOST = process.env.SERVICES_API_DB_HOST;
const DB_PORT = process.env.SERVICES_API_DB_PORT;
const DB_NAME = process.env.SERVICES_API_DB_NAME;

app.set('port', process.env.SERVICES_API_PORT);

mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
})
.then(db => console.log('[OK] DB is connected'))
.catch(err => console.error(err));

app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(morgan('dev'));
app.use(locale(supportedLocales));

/**
 *  Routes include
 * */
app.use(`${apiPrefix}/accounts`, accountsRoutes());
app.use(`${apiPrefix}/models/account-types`, modelsAccountTypesRoutes());
app.use(`${apiPrefix}/models/categories`, modelsCategoriesRoutes());
app.use(`${apiPrefix}/models/currencies`, modelsCurrenciesRoutes());
app.use(`${apiPrefix}/models/payment-types`, modelsPaymentTypesRoutes());
app.use(`${apiPrefix}/models/transaction-types`, modelsTransactionTypesRoutes());

app.listen(app.get('port'), () => {
  console.log(`[OK] Server is running on localhost:${app.get('port')}`);
});
