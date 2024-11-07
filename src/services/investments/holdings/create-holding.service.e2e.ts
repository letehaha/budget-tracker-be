import { ACCOUNT_CATEGORIES } from 'shared-types';
import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';

jest.setTimeout(30_000);

describe('Create holding service', () => {
  it('create holding', async () => {
    await helpers.syncSecuritiesData();
    const securities = await helpers.getSecuritiesList({ raw: true });
    const mockedSecurity = securities[0]!;
    const account = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        accountCategory: ACCOUNT_CATEGORIES.investment,
      },
      raw: true,
    });

    const response = await helpers.createHolding({
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
      },
    });

    expect(response.statusCode).toBe(200);

    const holdings = await helpers.getHoldings({
      raw: true,
    });

    expect(holdings.length).toBe(1);
  });

  describe('failure flows', () => {
    it('cannot create holding for non-investment account', async () => {
      await helpers.syncSecuritiesData();
      const securities = await helpers.getSecuritiesList({ raw: true });
      const mockedSecurity = securities[0]!;
      const account = await helpers.createAccount({
        payload: {
          ...helpers.buildAccountPayload(),
          accountCategory: ACCOUNT_CATEGORIES.general,
        },
        raw: true,
      });

      const response = await helpers.createHolding({
        payload: {
          accountId: account.id,
          securityId: mockedSecurity.id,
        },
      });

      expect(response.statusCode).toBe(422);

      const holdings = await helpers.getHoldings({
        raw: true,
      });

      expect(holdings.length).toBe(0);
    });
    it('throws when trying to create holding for non-existing account', async () => {
      await helpers.syncSecuritiesData();
      const securities = await helpers.getSecuritiesList({ raw: true });
      const mockedSecurity = securities[0]!;

      const result = await helpers.createHolding({
        payload: {
          accountId: 21212121212,
          securityId: mockedSecurity.id,
        },
      });

      expect(result.status).toEqual(ERROR_CODES.ValidationError);
    });
    it('throws when trying to create holding for non-existing security', async () => {
      await helpers.syncSecuritiesData();
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
