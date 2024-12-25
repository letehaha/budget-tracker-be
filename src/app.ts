import dotenv from 'dotenv';
import 'module-alias/register';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import config from 'config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import locale from 'locale';
import passport from 'passport';
import { logger } from '@js/utils/logger';

/**
 *  Routes
 * */
import authRoutes from './routes/auth.route';
import usersRoutes from './routes/users.route';
import userRoutes from './routes/user.route';
import accountsRoutes from './routes/accounts.route';
import transactionsRoutes from './routes/transactions.route';
import categoriesRoutes from './routes/categories.route';
import modelsCurrenciesRoutes from './routes/currencies.route';
import monobankRoutes from './routes/banks/monobank.route';
import binanceRoutes from './routes/crypto/binance.route';
import statsRoutes from './routes/stats.route';
import accountGroupsRoutes from './routes/account-groups';
import testsRoutes from './routes/tests.route';
import exchangeRatesRoutes from './routes/exchange-rates';

import { supportedLocales } from './translations';

import middlewarePassword from './middlewares/passport';
import { requestIdMiddleware } from '@middlewares/request-id';
import { sessionMiddleware } from '@middlewares/session-id';

import { loadCurrencyRatesJob } from './crons/exchange-rates';

import './redis';

export const app = express();
const apiPrefix = config.get('apiPrefix');

app.use(passport.initialize());
middlewarePassword(passport);

app.use(requestIdMiddleware);

app.set('port', config.get('port'));

loadCurrencyRatesJob.start();

app.use(
  cors({
    origin(requestOrigin, callback) {
      const ALLOWED_HOSTS = ['127.0.0.1:8100', 'budget-tracker.com:8100', '206.81.20.28:8081', 'gamanets.money'];

      if (process.env.NODE_ENV !== 'test') {
        if (!requestOrigin || !ALLOWED_HOSTS.some((value) => requestOrigin.includes(value))) {
          return callback(null, false);
        }
      }

      return callback(null, true);
    },
    exposedHeaders: ['x-session-id', 'x-request-id'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(locale(supportedLocales));
app.use(sessionMiddleware);

/**
 *  Routes include
 * */
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/users`, usersRoutes);
app.use(`${apiPrefix}/accounts`, accountsRoutes);
app.use(`${apiPrefix}/transactions`, transactionsRoutes);
app.use(`${apiPrefix}/categories`, categoriesRoutes);
app.use(`${apiPrefix}/models/currencies`, modelsCurrenciesRoutes);
app.use(`${apiPrefix}/banks/monobank`, monobankRoutes);
app.use(`${apiPrefix}/crypto/binance`, binanceRoutes);
app.use(`${apiPrefix}/stats`, statsRoutes);
app.use(`${apiPrefix}/account-group`, accountGroupsRoutes);
app.use(`${apiPrefix}/currencies/rates`, exchangeRatesRoutes);

if (process.env.NODE_ENV === 'test') {
  app.use(`${apiPrefix}/tests`, testsRoutes);
}

// Cause some tests can be parallelized, the port might be in use, so we need to allow dynamic port
export const serverInstance = app.listen(process.env.NODE_ENV === 'test' ? 0 : app.get('port'), () => {
  logger.info(`[OK] Server is running on localhost:${app.get('port')}`);
});
