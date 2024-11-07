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
    const account = await helpers.createInvestmentAccount({
      raw: true,
    });

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

    console.log('accountUpdated', accountUpdated);

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

  it.skip('correctly works for non-base currency with multiple securities', async () => {
    const currencyUAH = global.MODELS_CURRENCIES.find((item) => item.code === 'UAH');
    // Change base currency to UAH so that we can calculate securities to ref currency
    await helpers.makeRequest({
      method: 'post',
      url: '/user/currencies/base',
      payload: { currencyId: currencyUAH.id },
    });

    await helpers.syncSecuritiesData();
    // Set up EUR currency and exchange rates
    const allCurrencies = await helpers.getAllCurrencies();
    const eur = allCurrencies.find((i) => i.code === 'EUR')!;
    const securities = await helpers.getSecuritiesList({ raw: true });
    const security1 = securities[0]!;
    const security2 = securities[1]!;
    const account = await helpers.createAccount({
      raw: true,
      payload: helpers.buildAccountPayload({ currencyId: eur.id }),
    });

    await helpers.makeRequest({
      method: 'post',
      url: '/user/currencies',
      payload: { currencies: [{ currencyId: eur.id }] },
      raw: false,
    });
    await helpers.editCurrencyExchangeRate({
      pairs: [
        { baseCode: 'USD', quoteCode: 'EUR', rate: 0.85 },
        { baseCode: 'EUR', quoteCode: 'USD', rate: 1.18 },
      ],
    });

    // Create holdings for both securities
    for (const security of [security1, security2]) {
      await helpers.createHolding({
        payload: { accountId: account.id, securityId: security.id },
      });
    }

    const transactions = [
      {
        securityId: security1.id,
        quantity: 10,
        price: 25.1,
        fees: 0.25,
        date: '2024-05-25',
        transactionType: TRANSACTION_TYPES.income,
      },
      {
        securityId: security2.id,
        quantity: 5,
        price: 50.0,
        fees: 0.5,
        date: '2024-05-26',
        transactionType: TRANSACTION_TYPES.income,
      },
      {
        securityId: security1.id,
        quantity: 3,
        price: 27.5,
        fees: 0.2,
        date: '2024-05-27',
        transactionType: TRANSACTION_TYPES.expense,
      },
      {
        securityId: security2.id,
        quantity: 2,
        price: 52.0,
        fees: 0.3,
        date: '2024-05-28',
        transactionType: TRANSACTION_TYPES.income,
      },
    ];

    for (const tx of transactions) {
      await helpers.createInvestmentTransaction({
        payload: {
          ...tx,
          accountId: account.id,
          date: new Date(tx.date).toISOString(),
        },
      });
    }

    const holdings = await helpers.getHoldings({ raw: true });
    const createdTransactions = await helpers.makeRequest({
      method: 'get',
      url: '/investing/transactions',
      payload: { accountId: account.id },
      raw: true,
    });
    // const accountUpdated = await helpers.getAccount({ id: account.id, raw: true });

    expect(holdings.length).toBe(2);
    expect(createdTransactions.length).toBe(transactions.length);

    // Calculate expected values for each security
    // const expectedValues = securities.slice(0, 2).map((security) => {
    //   const securityTxs = transactions.filter((tx) => tx.securityId === security.id);
    //   const quantity = securityTxs.reduce(
    //     (sum, tx) =>
    //       tx.transactionType === TRANSACTION_TYPES.income ? sum + tx.quantity : sum - tx.quantity,
    //     0,
    //   );
    //   const eurValue = securityTxs.reduce((sum, tx) => {
    //     const txAmount = tx.quantity * tx.price;
    //     return tx.transactionType === TRANSACTION_TYPES.income ? sum + txAmount : sum - txAmount;
    //   }, 0);
    //   const eurFees = securityTxs.reduce((sum, tx) => sum + tx.fees, 0);
    //   const eurTotalValue = eurValue - eurFees;
    //   const usdTotalValue = Math.round(eurTotalValue * 1.18 * 100) / 100;
    //   return { securityId: security.id, quantity, eurTotalValue, usdTotalValue };
    // });

    // console.log('expectedValues', expectedValues);
    // console.log('holdings', holdings);

    const holdingA = holdings.find((h) => h.securityId === security1.id)!;
    console.log('holdingA', holdingA);
    expect({
      quantity: Number(holdingA.quantity),
      costBasis: Number(holdingA.costBasis),
      refCostBasis: Number(holdingA.refCostBasis),
    }).toStrictEqual({
      quantity: 7,
      costBasis: 10 * 25.1 + 0.25 - 3 * 27.5 + 0.2,
      refCostBasis: (10 * 25.1 + 0.25) * 1.18 - (3 * 27.5 + 0.2) * 1.18,
    });
    // const holdingB = holdings.find((h) => h.securityId === security1.id)!;

    // holdings.forEach((holding) => {
    //   const expected = expectedValues.filter((v) => v.securityId === holding.securityId)!;
    //   expect(Number(holding.quantity)).toBe(expected.reduce((a, b) => a + b.quantity, 0));
    //   expect(Number(holding.value)).toBeCloseTo(
    //     expected.reduce((a, b) => a + b.eurTotalValue, 0),
    //     2,
    //   );
    //   expect(Number(holding.refValue)).toBeCloseTo(
    //     expected.reduce((a, b) => a + b.usdTotalValue, 0),
    //     2,
    //   );
    // });

    // createdTransactions.forEach((tx, index) => {
    //   const originalTx = transactions[index]!;
    //   expect(tx.securityId).toBe(originalTx.securityId);
    //   expect(Number(tx.quantity)).toBe(originalTx.quantity);
    //   expect(Number(tx.price)).toBe(originalTx.price);
    //   expect(Number(tx.fees)).toBe(originalTx.fees);
    //   expect(tx.transactionType).toBe(originalTx.transactionType);

    //   const txEurAmount = originalTx.quantity * originalTx.price;
    //   expect(Number(tx.amount)).toBeCloseTo(txEurAmount, 2);
    //   expect(Number(tx.refAmount)).toBeCloseTo(txEurAmount * 1.18, 2);
    // });

    // const totalUsdValue = expectedValues.reduce((sum, v) => sum + v.usdTotalValue, 0);
    // const expectedAccountBalance = Math.round(totalUsdValue * 100);
    // expect(accountUpdated.currentBalance).toBe(expectedAccountBalance);
  });

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
