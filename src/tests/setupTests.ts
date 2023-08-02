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

// const DBConfig: Record<string, unknown> = config.get('db');
// const client = new Client({
//   user: 'letehaha',
//   password: 'password',
//   host: '127.0.0.1',
//   database: 'budget-tracker',
// });

// client.connect();

global.BASE_CURRENCY_ID = 2;
global.APP_AUTH_TOKEN = null;

beforeEach(async () => {
  try {
    // console.log(1.2)
    // client.query(`DROP DATABASE "budget-tracker_test"`, (err, res) => {
    //   console.log('DROP DATABASE err', err);
    // });
    // client.query(`CREATE DATABASE "budget-tracker_test"`, (err, res) => {
    //   console.log('CREATE DATABASE err', err);
    // });
    // await connection.sequelize.sync({ force: true })
    // for (const model of Object.keys(connection.sequelize.models)) {
    //   await connection.sequelize.models[model].destroy({ where: {} });
    // }
    // try {
    //   console.log('START QUERY');
    //   await connection.sequelize.query(`DROP TABLE IF EXISTS "MonobankUsers"`);
    //   console.log('END QUERY');
    // } catch (err) {
    //   console.log(5)
    // }

    // const data = await connection.sequelize.models.MonobankUsers.findAll({ raw: true });
    // console.log('MonobankUsers data', data)
    await connection.sequelize.drop({ cascade: true });
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

    await makeRequest({
      method: 'post',
      url: '/user/currencies/base',
      payload: { currencyId: global.BASE_CURRENCY_ID },
    });
  } catch (err) {
    console.log(err)
  }
})

afterAll(async () => {
  try {
    await redisClient.quit();
    // await connection.sequelize.close();
    await serverInstance.close();
  } catch (err) {
    console.log('afterAll', err);
  }
});
