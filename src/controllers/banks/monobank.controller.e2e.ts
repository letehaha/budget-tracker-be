/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import {
  ACCOUNT_TYPES,
  ExternalMonobankClientInfoResponse,
  API_ERROR_CODES,
} from 'shared-types';
import path from 'path';
import request from 'supertest';
import Umzug from 'umzug';
import { app, serverInstance, redisClient } from '@root/app';
import { connection } from '@models/index';
import { ERROR_CODES } from '@js/errors';
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
    path: path.join(__dirname, '../../migrations'),
    // The pattern that determines whether files are migrations
    pattern: /\.js$/,
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: connection.sequelize,
  },
});

const getMockedClientData = (): { data: ExternalMonobankClientInfoResponse } => ({
  data: {
    clientId: 'sdfsdfsdf',
    name: 'Test User',
    webHookUrl: '',
    permissions: '',
    accounts: [
      {
        id: 'test-account-1',
        sendId: 'test-send-id-1',
        balance: 250000,
        creditLimit: 200000,
        type: 'black',
        currencyCode: 980,
        cashbackType: 'Miles',
        maskedPan: [],
        iban: 'test iban 1',
      },
      {
        id: 'test-account-2',
        sendId: 'test-send-id-2',
        balance: 1000,
        creditLimit: 0,
        type: 'black',
        currencyCode: 840,
        cashbackType: 'Miles',
        maskedPan: [],
        iban: 'test iban 2',
      },
    ],
    jars: [],
  },
});

const DUMB_MONOBANK_API_TOKEN = '234234234234';
const BASE_CURRENCY_ID = 2;

describe('Balances model', () => {
  afterAll(() => {
    redisClient.quit();
    serverInstance.close();
  });

  let token

  beforeEach(async () => {
    try {
      await connection.sequelize.sync({ force: true });
      await connection.sequelize.drop({ cascade: true });
      redisClient.FLUSHALL('SYNC');
      await umzug.up();

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'test1',
          password: 'test1',
        });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'test1',
          password: 'test1',
        });

      token = extractResponse(res).token;

      await request(app)
        .post('/api/v1/user/currencies/base')
        .set('Authorization', token)
        .send({ currencyId: BASE_CURRENCY_ID });
    } catch (err) {
      console.log(err)
    }
  })

  describe('Pair Monobank account', () => {
    it('throws validation error if no "token" passed', async () => {
      const result = await makeRequest({
        method: 'post',
        url: '/banks/monobank/pair-user',
        token,
      });

      expect(result.status).toEqual(ERROR_CODES.ValidationError);
    });
    it('throws error if invalid "token" is passed', async () => {
      const result = await makeRequest({
        method: 'post',
        url: '/banks/monobank/pair-user',
        token,
        payload: {
          token: DUMB_MONOBANK_API_TOKEN,
        },
      });

      expect(result.status).toEqual(ERROR_CODES.NotFoundError);
    });
    it('creates Monobank user and correct accounts with valid token', async () => {
      const mockedClientData = getMockedClientData();
      (axios as any).mockResolvedValueOnce(mockedClientData);

      const createdMonoUserRestult = await makeRequest({
        method: 'post',
        url: '/banks/monobank/pair-user',
        token,
        payload: {
          token: DUMB_MONOBANK_API_TOKEN,
        },
      });

      expect(extractResponse(createdMonoUserRestult).apiToken).toBe(DUMB_MONOBANK_API_TOKEN);
      expect(extractResponse(createdMonoUserRestult).accounts.length).toBe(mockedClientData.data.accounts.length);

      const accountResult = extractResponse(await makeRequest({ method: 'get', url: '/accounts', token }));

      mockedClientData.data.accounts.forEach((item, index) => {
        const mockedAccount = mockedClientData.data.accounts[index];
        const resultItem = accountResult[index];

        expect(resultItem.initialBalance).toBe(0);
        expect(resultItem.currentBalance).toBe(mockedAccount.balance);
        expect(resultItem.type).toBe(ACCOUNT_TYPES.monobank);
        // By default all Monobank accounts should be disabled so we will load
        // new transactions only to accounts that user choosed
        expect(resultItem.isEnabled).toBe(false);
      })
    });
    it('handles case when trying to pair existing account', async () => {
      const mockedClientData = getMockedClientData();
      (axios as any).mockResolvedValueOnce(mockedClientData);

      const result = await makeRequest({
        method: 'post',
        url: '/banks/monobank/pair-user',
        token,
        payload: {
          token: DUMB_MONOBANK_API_TOKEN,
        },
      });

      expect(result.status).toBe(200);

      const oneMoreResult = await makeRequest({
        method: 'post',
        url: '/banks/monobank/pair-user',
        token,
        payload: {
          token: DUMB_MONOBANK_API_TOKEN,
        },
      });

      expect(extractResponse(oneMoreResult).code).toBe(API_ERROR_CODES.monobankUserAlreadyConnected);
    });
  });
})
