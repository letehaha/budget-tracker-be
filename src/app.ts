import dotenv from "dotenv";
import 'module-alias/register';

dotenv.config();
import config from 'config';
import express, { Request } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createClient } from 'redis';
import locale from 'locale';
import passport from 'passport';
import { promisify } from 'util';

/**
 *  Routes
 * */
import authRoutes from './routes/auth.route';
import usersRoutes from './routes/users.route';
import userRoutes from './routes/user.route';
import accountsRoutes from './routes/accounts.route';
import transactionsRoutes from './routes/transactions.route';
import modelsAccountTypesRoutes from './routes/account-types.route';
import сategoriesRoutes from './routes/categories.route';
import modelsCurrenciesRoutes from './routes/currencies.route';
import modelsPaymentTypesRoutes from './routes/payment-types.route';
import modelsTransactionTypesRoutes from './routes/transaction-types.route';
import modelsTransactionEntitiesRoutes from './routes/transaction-entities.route';
import monobankRoutes from './routes/banks/monobank.route';
import binanceRoutes from './routes/crypto/binance.route';

import { supportedLocales } from './translations';

import middlewarePassword from './middlewares/passport';

const app = express();
const apiPrefix = config.get('apiPrefix');
const redisClient = createClient({
  host: config.get('redis.host'),
});

redisClient.on('error', (error: unknown) => {
  // eslint-disable-next-line no-undef
  console.error('Redis Client Error', error);
});

['get', 'set', 'del', 'expire'].forEach((item) => {
  redisClient[item] = promisify(redisClient[item]);
});

app.use((req, res, next) => {
  (req as Request & typeof redisClient).redisClient = redisClient;
  next();
});

app.use(passport.initialize());
middlewarePassword(passport);

app.set('port', config.get('port'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(locale(supportedLocales));

/**
 *  Routes include
 * */
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/users`, usersRoutes);
app.use(`${apiPrefix}/accounts`, accountsRoutes);
app.use(`${apiPrefix}/transactions`, transactionsRoutes);
app.use(`${apiPrefix}/categories`, сategoriesRoutes);
app.use(`${apiPrefix}/models/account-types`, modelsAccountTypesRoutes);
app.use(`${apiPrefix}/models/currencies`, modelsCurrenciesRoutes);
app.use(`${apiPrefix}/models/payment-types`, modelsPaymentTypesRoutes);
app.use(`${apiPrefix}/models/transaction-types`, modelsTransactionTypesRoutes);
app.use(`${apiPrefix}/models/transaction-entities`, modelsTransactionEntitiesRoutes);
app.use(`${apiPrefix}/banks/monobank`, monobankRoutes);
app.use(`${apiPrefix}/crypto/binance`, binanceRoutes);

app.listen(app.get('port'), () => {
  // eslint-disable-next-line no-console
  // eslint-disable-next-line no-undef
  console.log(`[OK] Server is running on localhost:${app.get('port')}`);
});