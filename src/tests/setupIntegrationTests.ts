import path from 'path';
import Umzug from 'umzug';
import { serverInstance } from '@root/app';
import { redisClient } from '@root/redis';
import { connection } from '@models/index';
import { makeRequest, extractResponse } from '@tests/helpers';
import { until } from '@common/helpers';

jest.mock('axios');

const umzug = new Umzug({
  migrations: {
    // The params that get passed to the migrations
    params: [connection.sequelize.getQueryInterface(), connection.sequelize.constructor],
    // The path to the migrations directory
    path: path.join(__dirname, '../migrations'),
    // The pattern that determines whether files are migrations
    pattern: /\.js$/,
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: connection.sequelize,
  },
});

global.BASE_CURRENCY = null;
global.BASE_CURRENCY_CODE = 'USD';
global.MODELS_CURRENCIES = null;
global.APP_AUTH_TOKEN = null;

async function dropAllEnums(sequelize) {
  // Get all ENUM types
  const enums = await sequelize.query(`
    SELECT t.typname as enumtype
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    GROUP BY t.typname;
  `);

  // Drop each ENUM
  for (const enumType of enums[0]) {
    await sequelize.query(`DROP TYPE "${enumType.enumtype}" CASCADE`);
  }
}

expect.extend({
  toBeAnythingOrNull(received) {
    if (received !== undefined) {
      return {
        message: () => `expected ${received} to be anything or null`,
        pass: true,
      };
    }
    return {
      message: () => `expected ${received} not to be undefined`,
      pass: false,
    };
  },
});

beforeEach(async () => {
  try {
    await until(async () => {
      // Wait until connection is established
      const result = await redisClient.hello();
      return !!result;
    });
    await connection.sequelize.drop({ cascade: true });
    await dropAllEnums(connection.sequelize);
    const workerKeys = await redisClient.keys(`${process.env.JEST_WORKER_ID}*`);
    if (workerKeys.length) {
      await redisClient.del(workerKeys);
    }
    await umzug.up();

    await makeRequest({
      method: 'post',
      url: '/auth/register',
      payload: {
        username: 'test1',
        password: 'test1',
      },
    });

    const res = await makeRequest({
      method: 'post',
      url: '/auth/login',
      payload: {
        username: 'test1',
        password: 'test1',
      },
    });

    global.APP_AUTH_TOKEN = extractResponse(res).token;

    // Don't waste time, just store base_currency to the global variable to not
    // call this request each time
    if (!global.BASE_CURRENCY || !global.MODELS_CURRENCIES) {
      const currencies = await makeRequest({
        method: 'get',
        url: '/models/currencies',
        raw: true,
      });

      global.MODELS_CURRENCIES = currencies;
      global.BASE_CURRENCY = currencies.find((item) => item.code === global.BASE_CURRENCY_CODE);
    }

    await makeRequest({
      method: 'post',
      url: '/user/currencies/base',
      payload: { currencyId: global.BASE_CURRENCY.id },
    });
  } catch (err) {
    console.log(err);
  }
}, 10_000);

afterAll(async () => {
  try {
    await redisClient.quit();
    await serverInstance.close();
  } catch (err) {
    console.log('afterAll', err);
  }
});
