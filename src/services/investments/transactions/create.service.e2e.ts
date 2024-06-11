import { TRANSACTION_TYPES } from 'shared-types';
import { faker } from '@faker-js/faker';
import * as helpers from '@tests/helpers';

describe('Create investment transaction service', () => {
  it(`
    - creates income transaction;
    - updates related holding;
    - updates related account balance;
  `, async () => {
    const mockedSecurity = global.SECURITIES_LIST[0];
    const account = await helpers.createAccount({ raw: true });

    await helpers.createHolding({
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
      },
    });

    const transactionValues = {
      quantity: faker.number.int({ min: 0.1, max: 1000.15 }),
      price: faker.number.int({ min: 0.1, max: 1000.15 }),
      fees: faker.number.int({ min: 0.1, max: 1000.15 }),
    };

    await helpers.makeRequest({
      method: 'post',
      url: '/investing/transaction',
      payload: {
        accountId: account.id,
        securityId: mockedSecurity.id,
        transactionType: TRANSACTION_TYPES.income,
        date: new Date(),
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
    expect(+holding.quantity).toBe(transactionValues.quantity);
    expect(+holding.value).toBe(
      transactionValues.quantity * transactionValues.price,
    );
    const costBasis =
      transactionValues.quantity * transactionValues.price +
      transactionValues.fees;
    expect(+holding.costBasis).toBe(costBasis);

    const [transaction] = transactions;

    expect(+transaction.fees).toBe(transactionValues.fees);
    expect(+transaction.quantity).toBe(transactionValues.quantity);
    expect(+transaction.price).toBe(transactionValues.price);
    const txAmount = transactionValues.quantity * transactionValues.price;
    expect(+transaction.amount).toBe(txAmount);

    // account data is always integer, so multiplied by 100
    expect(accountUpdated.currentBalance).toBe(txAmount * 100);
  });
  it.todo(
    'correctly works for non-base currency (ref values are correct for tx, holdings, and account balance)',
  );
  it.todo('after creation, the balances table is updated correctly');
  it.todo('after creation, statistics are updated correctly');

  describe('failure cases', () => {
    it.todo(
      'throws when trying to create transaction when holding does not exist',
    );
    it.todo(
      'throws when trying to create transaction when account does not exist',
    );
    it.todo(
      'throws when trying to create transaction when security does not exist',
    );
  });
});
