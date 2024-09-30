import { TRANSACTION_TYPES, TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import { format, subDays, subMonths, subWeeks, subYears } from 'date-fns';
import * as helpers from '@tests/helpers';

describe('Get expense amount for period', () => {
  it(`should display expences amount for
      - a day
      - two transactions
      - income doesn't affect stats
      - transfer doesn't affect stats
  `, async () => {
    const account = await helpers.createAccount({ raw: true });
    const txPayload = helpers.buildTransactionPayload({
      accountId: account.id,
      amount: 2000,
    });
    const [expense] = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    //check the total expence amount
    let stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      raw: true,
    });

    expect(stats).toBe(2000);

    //check total expence of two transactions
    await helpers.createTransaction({
      payload: { ...txPayload, amount: 3000 },
      raw: true,
    });
    stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      raw: true,
    });

    expect(stats).toBe(5000);

    //check that income transaction does not affect the total balance
    await helpers.createTransaction({
      payload: { ...txPayload, transactionType: TRANSACTION_TYPES.income },
      raw: true,
    });
    stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      raw: true,
    });

    expect(stats).toBe(5000);

    //check that expence balance does not change after transfer
    const accountB = await helpers.createAccount({ raw: true });
    const transferTxPayload = helpers.buildTransactionPayload({
      destinationAmount: 2000,
      destinationAccountId: accountB.id,
      transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
      accountId: account.id,
      amount: 2000,
    });
    await helpers.createTransaction({ payload: transferTxPayload });
    stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      raw: true,
    });

    expect(stats).toBe(5000);

    //check that after changing expence to income total stats decreases
    await helpers.updateTransaction({
      id: expense.id,
      payload: {
        transactionType: TRANSACTION_TYPES.income,
      },
    });

    stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      raw: true,
    });

    expect(stats).toBe(3000);

    //check that after making a refund total expence amount does not change
    const [baseTx] = await helpers.createTransaction({
      payload: helpers.buildTransactionPayload({
        accountId: account.id,
        amount: 100,
        transactionType: TRANSACTION_TYPES.expense,
      }),
      raw: true,
    });

    const [refundTx] = await helpers.createTransaction({
      payload: helpers.buildTransactionPayload({
        accountId: account.id,
        amount: 100,
        transactionType: TRANSACTION_TYPES.income,
      }),
      raw: true,
    });

    await helpers.createSingleRefund({
      originalTxId: baseTx.id,
      refundTxId: refundTx.id,
    });

    stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      raw: true,
    });

    expect(stats).toBe(3000);

    //check that expence balance does not change after transfer in different currency
    const allCurrencies = await helpers.getAllCurrencies();
    const uah = allCurrencies.find((i) => i.code === 'UAH')!;
    const accountC = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: uah.id,
      },
      raw: true,
    });

    const currencies = [{ currencyId: uah.id, exchangeRate: 40, liveRateUpdate: true }];

    await helpers.updateUserCurrencies({
      currencies,
      raw: false,
    });

    const secondTransferTxPayload = helpers.buildTransactionPayload({
      destinationAmount: 4000,
      destinationAccountId: accountC.id,
      transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
      accountId: accountB.id,
      amount: 100,
    });

    await helpers.createTransaction({ payload: secondTransferTxPayload });

    stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      raw: true,
    });

    expect(stats).toBe(3000);

    //check that expence amount equals 0 for a day earlier after making a transaction
    const dayBefore = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .split('T')[0];

    // Create a transaction for today
    await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    // Check the expenses amount for the day before
    stats = await helpers.makeRequest({
      method: 'get',
      url: '/stats/expenses-amount-for-period',
      payload: {
        from: dayBefore,
        to: dayBefore,
      },
      raw: true,
    });

    expect(stats).toBe(0);
  });

  it(`should display expences amount for different time periods (day, week, month, year)`, async () => {
    //create transactions for random periods of time
    const account = await helpers.createAccount({ raw: true });
    const accountB = await helpers.createAccount({ raw: true });
    const accountC = await helpers.createAccount({ raw: true });
    await Promise.all(
      [
        { time: new Date(), amount: 2000, accountId: account.id },
        { time: subDays(new Date(), 1), amount: 3000, accountId: accountB.id },
        { time: subDays(new Date(), 7), amount: 3500, accountId: account.id },
        { time: subDays(new Date(), 10), amount: 2000, accountId: accountC.id },
        { time: subMonths(new Date(), 1), amount: 4000, accountId: account.id },
        { time: subMonths(new Date(), 2), amount: 18000, accountId: accountB.id },
        { time: subMonths(new Date(), 2), amount: 15000, accountId: accountB.id },
        { time: subYears(new Date(), 1), amount: 100, accountId: account.id },
      ].map((payload) =>
        helpers.createTransaction({
          payload: {
            ...helpers.buildTransactionPayload({
              ...payload,
              time: payload.time.toISOString(),
            }),
          },
          raw: true,
        }),
      ),
    );
    // 1 день назад, 5 дней назад, месяц назад, квартал назад

    //check expence period for a day/week/month/year
    const periods = {
      day: {
        from: subDays(new Date(), 1),
        to: new Date(),
        expected: 5000,
      },
      week: {
        from: subWeeks(new Date(), 1),
        to: new Date(),
        expected: 8500,
      },
      month: {
        from: subMonths(new Date(), 1),
        to: new Date(),
        expected: 14500,
      },
      year: {
        from: subYears(new Date(), 1),
        to: new Date(),
        expected: 47600,
      },
    };

    for (const { from, to, expected } of Object.values(periods)) {
      const stats = await helpers.makeRequest({
        method: 'get',
        url: '/stats/expenses-amount-for-period',
        // Pass from and to as payload
        payload: { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') },
        raw: true,
      });

      // Expect the total expense amount to match the expected value
      expect(stats).toBe(expected);
    }
  });
});
