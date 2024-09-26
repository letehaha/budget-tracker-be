import { TRANSACTION_TYPES } from 'shared-types';
import { isSameDay, isBefore } from 'date-fns';
import * as helpers from '@tests/helpers';

jest.setTimeout(30_000);

describe('Create investment transaction service', () => {
  it.skip(`
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
      date: new Date('2024-05-25'),
    };

    await helpers.makeRequest({
      method: 'post',
      url: '/investing/transaction',
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

    console.log('updatedBalances', updatedBalances);
    expect(updatedBalances.length).toBe(2);
    expect(
      updatedBalances.find((item) => isSameDay(new Date(item.date), transactionValues.date)).amount,
    ).toBe(expectedAccountBalance);
    expect(
      updatedBalances.find((item) => isBefore(new Date(item.date), transactionValues.date)).amount,
    ).toBe(0);
  });
  it.todo(
    'correctly works for non-base currency (ref values are correct for tx, holdings, and account balance)',
  );
  it.todo('after creation, the balances table is updated correctly');
  it.todo('after creation, statistics are updated correctly');

  describe('failure cases', () => {
    it.todo('throws when trying to create transaction when holding does not exist');
    it.todo('throws when trying to create transaction when account does not exist');
    it.todo('throws when trying to create transaction when security does not exist');
  });
});
