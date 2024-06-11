import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';

describe('Create holding service', () => {
  it('create holding', async () => {
    const mockedSecurity = global.SECURITIES_LIST[0];
    const account = await helpers.createAccount({ raw: true });

    await helpers.createHolding({
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
      },
    });

    const holdings = await helpers.getHoldings({
      raw: true,
    });

    expect(holdings.length).toBe(1);
  });

  describe('failure flows', () => {
    it('throws when trying to create holding for non-existing account', async () => {
      const mockedSecurity = global.SECURITIES_LIST[0];

      const result = await helpers.createHolding({
        payload: {
          accountId: 21212121212,
          securityId: mockedSecurity.id,
        },
      });

      expect(result.status).toEqual(ERROR_CODES.ValidationError);
    });
    it('throws when trying to create holding for non-existing security', async () => {
      const account = await helpers.createAccount({ raw: true });

      const result = await helpers.createHolding({
        payload: {
          accountId: account.id,
          securityId: 121212121212,
        },
      });

      expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
    });
  });
});
