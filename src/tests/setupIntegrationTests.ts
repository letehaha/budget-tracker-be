import path from 'path';
import Umzug from 'umzug';
import { serverInstance, redisClient } from '@root/app';
import { connection } from '@models/index';
import { makeRequest, extractResponse } from '@tests/helpers';

jest.mock('axios');

const umzug = new Umzug({
  migrations: {
    // The params that get passed to the migrations
    params: [
      connection.sequelize.getQueryInterface(),
      connection.sequelize.constructor,
    ],
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

beforeEach(async () => {
  try {
    await connection.sequelize.drop({ cascade: true });
    await dropAllEnums(connection.sequelize);
    redisClient.FLUSHALL('SYNC');
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
      global.BASE_CURRENCY = currencies.find((item) => item.code === 'USD');
    }

    await makeRequest({
      method: 'post',
      url: '/user/currencies/base',
      payload: { currencyId: global.BASE_CURRENCY.id },
    });
  } catch (err) {
    console.log(err);
  }
});

afterAll(async () => {
  try {
    await redisClient.quit();
    // await connection.sequelize.close();
    await serverInstance.close();
  } catch (err) {
    console.log('afterAll', err);
  }
});
