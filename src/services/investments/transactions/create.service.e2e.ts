import { TRANSACTION_TYPES } from 'shared-types';
import { format } from 'date-fns';
import * as helpers from '@tests/helpers';
import { ERROR_CODES } from '@js/errors';

jest.setTimeout(30_000);

describe('Create investment transaction service', () => {
  it(`
    - creates income transaction;
    - updates related holding;
    - updates related account balance;
    - updates balance changes history;
  `, async () => {
    await helpers.syncSecuritiesData();
    const securities = await helpers.getSecuritiesList({ raw: true });
    const mockedSecurity = securities[0]!;
    const account = await helpers.createAccount({ raw: true });

    const balances = await helpers.makeRequest({
      method: 'get',
      url: '/stats/balance-history',
      payload: {
        accountId: account.id,
      },
      raw: true,
    });

    // has initial balance record
    expect(balances.length).toBe(1);

    await helpers.createHolding({
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
      },
    });

    const transactionValues = {
      quantity: 10,
      price: 25.1,
      fees: 0.25,
      date: new Date('2024-05-25').toISOString(),
    };

    await helpers.createInvestmentTransaction({
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
        transactionType: TRANSACTION_TYPES.income,
        ...transactionValues,
      },
    });

    const holdings = await helpers.getHoldings({
      raw: true,
    });
    const transactions = await helpers.makeRequest({
      method: 'get',
      url: '/investing/transactions',
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
      },
      raw: true,
    });

    const accountUpdated = await helpers.getAccount({
      id: account.id,
      raw: true,
    });

    expect(holdings.length).toBe(1);
    expect(transactions.length).toBe(1);

    const [holding] = holdings;
    expect(Number(holding!.quantity)).toBe(transactionValues.quantity);
    expect(Number(holding!.value)).toBe(251);
    expect(Number(holding!.costBasis)).toBe(251.25);

    const [transaction] = transactions;

    expect(Number(transaction.fees)).toBe(transactionValues.fees);
    expect(Number(transaction.quantity)).toBe(transactionValues.quantity);
    expect(Number(transaction.price)).toBe(transactionValues.price);
    expect(Number(transaction.amount)).toBe(251);

    // account data is always integer, so multiplied by 100
    const expectedAccountBalance = 251 * 100;
    expect(accountUpdated.currentBalance).toBe(expectedAccountBalance);

    const updatedBalances = await helpers.makeRequest({
      method: 'get',
      url: '/stats/balance-history',
      payload: {
        accountId: accountUpdated.id,
      },
      raw: true,
    });

    expect(updatedBalances.length).toBe(3);
    expect(updatedBalances).toStrictEqual([
      { date: '2024-05-24', amount: 0 },
      { date: '2024-05-25', amount: expectedAccountBalance },
      // Since account was created today, the balance should be updated for today too
      { date: format(new Date(), 'yyyy-MM-dd'), amount: expectedAccountBalance },
    ]);
  });
  it.todo(
    'correctly works for non-base currency (ref values are correct for tx, holdings, and account balance)',
  );
  it.todo('after creation, the balances table is updated correctly');
  it.todo('after creation, statistics are updated correctly');

  describe('failure cases', () => {
    it(`throws when trying to create transaction when:
        - holding does not exist
        - account does not exist
        - security does not exist
    `, async () => {
      await helpers.syncSecuritiesData();
      const securities = await helpers.getSecuritiesList({ raw: true });
      const mockedSecurity = securities[0]!;
      const account = await helpers.createAccount({ raw: true });
      const basePayload = {
        accountId: account.id,
        securityId: mockedSecurity.id,
        transactionType: TRANSACTION_TYPES.income,
        quantity: 10,
        date: new Date().toISOString(),
        price: 25.1,
        fees: 0.25,
      };

      expect(
        (
          await helpers.createInvestmentTransaction({
            payload: {
              ...basePayload,
              accountId: account.id,
              securityId: mockedSecurity.id,
            },
          })
        ).statusCode,
      ).toBe(ERROR_CODES.ValidationError);

      expect(
        (
          await helpers.createInvestmentTransaction({
            payload: {
              ...basePayload,
              accountId: 10101010101,
            },
          })
        ).statusCode,
      ).toBe(ERROR_CODES.ValidationError);

      expect(
        (
          await helpers.createInvestmentTransaction({
            payload: {
              ...basePayload,
              securityId: 10000000,
            },
          })
        ).statusCode,
      ).toBe(ERROR_CODES.ValidationError);
    });
  });
});
