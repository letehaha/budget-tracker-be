import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';
import { API_RESPONSE_STATUS } from 'shared-types';

describe('Create holding service', () => {
  it('create holding', async () => {
    const mockedSecurity = global.SECURITIES_LIST[0];
    const account = await helpers.createAccount({ raw: true });

    await helpers.makeRequest({
      method: 'post',
      url: '/investing/holdings',
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
      },
    });

    const holdings = await helpers.makeRequest({
      method: 'get',
      url: '/investing/holdings',
      raw: true,
    });

    expect(holdings.length).toBe(1);
  });

  describe('failure flows', () => {
    it('throws when trying to create holding for non-existing account', async () => {
      const mockedSecurity = global.SECURITIES_LIST[0];

      const result = await helpers.makeRequest({
        method: 'post',
        url: '/investing/holdings',
        payload: {
          accountId: 21212121212,
          securityId: mockedSecurity.id,
        },
      });

      expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
      expect(result.body.status).toEqual(API_RESPONSE_STATUS.error);
    });
    it('throws when trying to create holding for non-existing security', async () => {
      const account = await helpers.createAccount({ raw: true });

      const result = await helpers.makeRequest({
        method: 'post',
        url: '/investing/holdings',
        payload: {
          accountId: account.id,
          securityId: 121212121212,
        },
      });

      expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
      expect(result.body.status).toEqual(API_RESPONSE_STATUS.error);
    });
  });
});
