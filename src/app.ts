import dotenv from "dotenv";
import 'module-alias/register';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import config from 'config';
import express, { Request } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createClient } from 'redis';
import locale from 'locale';
import passport from 'passport';
import { promisify } from 'util';
import { logger} from '@js/utils/logger';

/**
 *  Routes
 * */
import authRoutes from './routes/auth.route';
import usersRoutes from './routes/users.route';
import userRoutes from './routes/user.route';
import accountsRoutes from './routes/accounts.route';
import transactionsRoutes from './routes/transactions.route';
import modelsAccountTypesRoutes from './routes/account-types.route';
import categoriesRoutes from './routes/categories.route';
import modelsCurrenciesRoutes from './routes/currencies.route';
import monobankRoutes from './routes/banks/monobank.route';
import binanceRoutes from './routes/crypto/binance.route';
import statsRoutes from './routes/stats.route';

import { supportedLocales } from './translations';

import middlewarePassword from './middlewares/passport';

export const app = express();
const apiPrefix = config.get('apiPrefix');
export const redisClient = createClient({
  host: config.get('redis.host'),
});

redisClient.on('error', (error: Error) => {
  logger.error({ message: 'Redis Client Error', error });
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

app.use(cors({
  origin(requestOrigin, callback) {
    const ALLOWED_HOSTS = ['budget-tracker.com:8100', '206.81.20.28:8081', 'gamanets.money']

    if (process.env.NODE_ENV !== 'test') {
      if (!requestOrigin || !ALLOWED_HOSTS.some(value => requestOrigin.includes(value))) {
        return callback(null, false);
      }
    }

    return callback(null, true);
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(locale(supportedLocales));

/**
 *  Routes include
 * */
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/user`, userRoutes);
app.use(`${apiPrefix}/users`, usersRoutes);
app.use(`${apiPrefix}/accounts`, accountsRoutes);
app.use(`${apiPrefix}/transactions`, transactionsRoutes);
app.use(`${apiPrefix}/categories`, categoriesRoutes);
app.use(`${apiPrefix}/models/account-types`, modelsAccountTypesRoutes);
app.use(`${apiPrefix}/models/currencies`, modelsCurrenciesRoutes);
app.use(`${apiPrefix}/banks/monobank`, monobankRoutes);
app.use(`${apiPrefix}/crypto/binance`, binanceRoutes);
app.use(`${apiPrefix}/stats`, statsRoutes);

// Cause some tests can be parallelized, the port might be in use, so we need to allow dynamic port
export const serverInstance = app.listen(process.env.NODE_ENV === 'test' ? 0 : app.get('port'), () => {
  // eslint-disable-next-line no-console
  // eslint-disable-next-line no-undef
  logger.info(`[OK] Server is running on localhost:${app.get('port')}`);
});
