import { TRANSACTION_TRANSFER_NATURE, TRANSACTION_TYPES } from 'shared-types';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import Transactions from '@models/Transactions.model';
import Balances from '@models/Balances.model';
import Currencies from '@models/Currencies.model';
import * as helpers from '@tests/helpers';
import UsersCurrencies from '@models/UsersCurrencies.model';

const callGetBalanceHistory = async (accountId, raw = false) => {
  const result = await helpers.makeRequest({
    method: 'get',
    url: '/stats/balance-history',
    payload: {
      accountId,
    },
  });

  return raw ? helpers.extractResponse(result) : result;
};
const callGelFullBalanceHistory = async (raw = false) => {
  const result = await helpers.makeRequest({
    method: 'get',
    url: '/stats/balance-history',
  });

  return raw ? helpers.extractResponse(result) : result;
};

describe('Balances service', () => {
  it('the balances table correctly managing account creation', async () => {
    const account = await helpers.createAccount({ raw: true });

    const balancesHistory = await callGetBalanceHistory(account.id);

    const result = helpers.extractResponse(balancesHistory);

    expect(balancesHistory.statusCode).toEqual(200);
    expect(result[0].amount).toEqual(account.initialBalance);
  });

  describe('the balances history table and account balance correctly updated when:', () => {
    const buildAccount = async ({
      accountInitialBalance = 0,
      currencyCode = null,
    }: {
      accountInitialBalance?: number;
      currencyCode?: string | null;
    } = {}) => {
      let newCurrency: Currencies | undefined = undefined;
      let currencyRate = 1;

      if (currencyCode) {
        newCurrency = global.MODELS_CURRENCIES.find((item) => item.code === currencyCode);
        await helpers.addUserCurrencies({ currencyCodes: [currencyCode] });
        currencyRate = (await helpers.getCurrenciesRates({ codes: ['UAH'] }))[0]!.rate;
      }

      const account = await helpers.createAccount({
        payload: helpers.buildAccountPayload({
          currencyId: newCurrency?.id || global.BASE_CURRENCY.id,
          initialBalance: accountInitialBalance,
          currentBalance: accountInitialBalance,
        }),
        raw: true,
      });

      expect(account.initialBalance).toBe(accountInitialBalance);
      expect(account.refInitialBalance).toBe(Math.floor(accountInitialBalance * currencyRate));

      const expense = helpers.buildTransactionPayload({
        accountId: account.id,
      });
      const income = helpers.buildTransactionPayload({
        accountId: account.id,
        transactionType: TRANSACTION_TYPES.income,
      });
      const initialBalancesHistory = await callGetBalanceHistory(account.id);

      expect(initialBalancesHistory.statusCode).toEqual(200);
      expect(helpers.extractResponse(initialBalancesHistory).length).toEqual(1);
      expect(helpers.extractResponse(initialBalancesHistory)[0].amount).toEqual(
        Math.floor(account.currentBalance * currencyRate),
      );

      return {
        accountData: account,
        currencyRate,
        expense,
        income,
      };
    };

    it('– adding transactions at the same date', async () => {
      const { accountData, expense, income } = await buildAccount();

      for (const type of [expense, expense, income]) {
        await helpers.createTransaction({ payload: type });
      }

      const finalBalancesHistory = await callGetBalanceHistory(accountData.id);

      expect(finalBalancesHistory.statusCode).toEqual(200);
      expect(helpers.extractResponse(finalBalancesHistory).length).toEqual(1);
      expect(helpers.extractResponse(finalBalancesHistory)[0].amount).toEqual(
        // since we have 2 expenses and 1 income, we can check for 1 expense
        accountData.currentBalance - expense.amount,
      );
    });

    it('– adding transactions at the same date and account has initial value', async () => {
      const { accountData, expense, income } = await buildAccount({
        accountInitialBalance: 1200,
      });

      for (const type of [expense, expense, income]) {
        await helpers.createTransaction({ payload: type });
      }

      const finalBalancesHistory = await callGetBalanceHistory(accountData.id);

      expect(finalBalancesHistory.statusCode).toEqual(200);
      expect(helpers.extractResponse(finalBalancesHistory).length).toEqual(1);
      expect(helpers.extractResponse(finalBalancesHistory)[0].amount).toEqual(
        // since we have 2 expenses and 1 income, we can check for 1 expense
        accountData.currentBalance - expense.amount,
      );
    });

    it(`[testing account's initialBalance]
      – creating account with custom amount
      – adding transaction for the next date
      – and then adding transaction for the prior account creation date
    `, async () => {
      const { accountData, expense, income } = await buildAccount({
        accountInitialBalance: 1000,
      });

      // Firstly create a transaction AFTER account creation date
      await helpers.createTransaction({
        payload: {
          ...expense,
          time: startOfDay(addDays(new Date(), 1)).toISOString(),
        },
      });

      const afterBalance = await callGetBalanceHistory(accountData.id, true);

      expect(afterBalance.length).toBe(2);
      expect(afterBalance.at(0).amount).toBe(accountData.initialBalance);
      expect(afterBalance.at(1).amount).toBe(accountData.initialBalance - expense.amount);

      // Then create a transaction BEFORE account creation date
      await helpers.createTransaction({
        payload: {
          ...income,
          time: startOfDay(subDays(new Date(), 1)).toISOString(),
        },
      });

      const beforeBalance = await callGetBalanceHistory(accountData.id, true);

      expect(beforeBalance.length).toBe(4);
      expect(beforeBalance.at(0).amount).toBe(accountData.initialBalance);
      expect(beforeBalance.at(1).amount).toBe(accountData.initialBalance + income.amount);
      expect(beforeBalance.at(2).amount).toBe(accountData.initialBalance + income.amount);
      expect(beforeBalance.at(3).amount).toBe(
        accountData.initialBalance - expense.amount + income.amount,
      );
    });

    it(`[testing account's initialBalance with transaction at that date]
      – creating account with custom amount
      – addin transaction for account creation date
      – adding transaction for the next date
      – and then adding transaction for the prior account creation date
    `, async () => {
      const { accountData, expense, income } = await buildAccount({
        accountInitialBalance: 1000,
      });

      // Firstly create a transaction AFTER account creation date
      await helpers.createTransaction({
        payload: {
          ...expense,
          time: startOfDay(addDays(new Date(), 1)).toISOString(),
        },
      });

      // Add transaction for the same day
      await helpers.createTransaction({
        payload: {
          ...income,
          time: startOfDay(new Date()).toISOString(),
        },
      });

      const afterBalance = await callGetBalanceHistory(accountData.id, true);

      expect(afterBalance.length).toBe(2);
      expect(afterBalance.at(0).amount).toBe(accountData.initialBalance + income.amount);
      expect(afterBalance.at(1).amount).toBe(
        accountData.initialBalance - expense.amount + income.amount,
      );

      // Then create a transaction BEFORE account creation date
      await helpers.createTransaction({
        payload: {
          ...income,
          time: startOfDay(subDays(new Date(), 1)).toISOString(),
        },
      });

      const beforeBalance = await callGetBalanceHistory(accountData.id, true);

      expect(beforeBalance.length).toBe(4);
      expect(beforeBalance.at(0).amount).toBe(accountData.initialBalance);
      expect(beforeBalance.at(1).amount).toBe(accountData.initialBalance + income.amount);
      expect(beforeBalance.at(2).amount).toBe(
        accountData.initialBalance + income.amount + income.amount,
      );
      expect(beforeBalance.at(3).amount).toBe(
        accountData.initialBalance - expense.amount + income.amount + income.amount,
      );
    });

    it('deleting transaction', async () => {
      const { accountData, expense, income } = await buildAccount({
        accountInitialBalance: 1000,
      });

      const transactionsPayloads = [
        { ...expense, time: startOfDay(addDays(new Date(), 1)) },
        { ...income, time: startOfDay(new Date()) },
        { ...income, time: startOfDay(subDays(new Date(), 1)) },
      ];
      const transactionResults: Transactions[] = [];

      // Send 3 transactions at different days
      for (const tx of transactionsPayloads) {
        const response = await helpers.createTransaction({
          payload: {
            ...tx,
            time: tx.time.toISOString(),
          },
          raw: true,
        });
        transactionResults.push(response[0]);
      }

      // Delete them
      for (const result of transactionResults.flat()) {
        await helpers.makeRequest({
          method: 'delete',
          url: `/transactions/${result.id}`,
        });
      }

      const finalBalanceHistory: Balances[] = await callGetBalanceHistory(accountData.id, true);

      // Since we added transaction prior account creation, we will have +1 transaction
      expect(finalBalanceHistory.length).toBe(4);
      // Check that after removing all the transactions, the initial balance is set to correct
      expect(
        finalBalanceHistory.every((record) => record.amount === accountData.initialBalance),
      ).toBe(true);
    });

    const mockBalanceHistory = async () => {
      const { accountData, expense, income } = await buildAccount({
        accountInitialBalance: 1000,
      });

      // Add record for account creation date, 2 days after and 2 days before
      const transactionsPayloads = [
        { ...expense, amount: 50, time: startOfDay(subDays(new Date(), 2)) },
        { ...income, amount: 200, time: startOfDay(subDays(new Date(), 1)) },
        { ...expense, amount: 100, time: startOfDay(addDays(new Date(), 1)) },
        { ...expense, amount: 50, time: startOfDay(addDays(new Date(), 2)) },
        { ...income, amount: 150, time: new Date() },
      ];
      const transactionResults: Transactions[] = [];

      for (const tx of transactionsPayloads) {
        const response = await helpers.createTransaction({
          payload: {
            ...tx,
            time: tx.time.toISOString(),
          },
          raw: true,
        });

        if (response) transactionResults.push(...(response as Transactions[]));
      }

      const balanceHistory: Balances[] = await callGetBalanceHistory(accountData.id, true);

      expect(balanceHistory).toStrictEqual([
        // Since we added transaction BEFORE account creation, we will always
        // have +1 record to represent initialBalance
        {
          date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
          amount: accountData.initialBalance,
        },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 950 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1300 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1200 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1150 },
      ]);

      return {
        accountData,
        balanceHistory,
        transactionResults,
      };
    };

    it('updating transaction amount [expense & income]', async () => {
      const { accountData, transactionResults } = await mockBalanceHistory();

      // Update expense transaction
      await helpers.updateTransaction({
        id: transactionResults[0]!.id,
        payload: { amount: 150 },
      });

      const newBalanceHistory1: Balances[] = await callGetBalanceHistory(accountData.id, true);

      expect(newBalanceHistory1).toStrictEqual([
        {
          date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
          amount: accountData.initialBalance,
        },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 850 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1050 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1200 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1100 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1050 },
      ]);

      // Update income transaction
      await helpers.updateTransaction({
        id: transactionResults[1]!.id,
        payload: { amount: 350 },
      });

      const newBalanceHistory2: Balances[] = await callGetBalanceHistory(accountData.id, true);

      expect(newBalanceHistory2).toStrictEqual([
        {
          date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
          amount: accountData.initialBalance,
        },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 850 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1200 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1350 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1250 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1200 },
      ]);
    });

    it('updating transaction amount, date, transactionType and accountId', async () => {
      const { accountData, transactionResults } = await mockBalanceHistory();

      await helpers.updateTransaction({
        id: transactionResults[0]!.id,
        payload: {
          amount: 150,
          time: startOfDay(subDays(new Date(), 4)).toISOString(),
          transactionType: TRANSACTION_TYPES.income,
        },
      });

      const newBalanceHistory1: Balances[] = await callGetBalanceHistory(accountData.id, true);

      expect(newBalanceHistory1).toStrictEqual([
        {
          date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
          amount: accountData.initialBalance,
        },
        { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1350 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1500 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1400 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1350 },
      ]);

      const { accountData: oneMoreAccountData } = await buildAccount({
        accountInitialBalance: 0,
      });

      await helpers.updateTransaction({
        id: transactionResults[3]!.id,
        payload: {
          amount: 150,
          time: startOfDay(addDays(new Date(), 5)).toISOString(),
          transactionType: TRANSACTION_TYPES.income,
          accountId: oneMoreAccountData.id,
        },
      });

      const newBalanceHistory2: Balances[] = await callGelFullBalanceHistory(true);

      // Yeah it looks really hard, but that's the way to verify everything is okay
      expect(newBalanceHistory2).toStrictEqual([
        {
          date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
          amount: accountData.initialBalance,
          accountId: accountData.id,
        },
        {
          date: format(subDays(new Date(), 4), 'yyyy-MM-dd'),
          amount: 1150,
          accountId: accountData.id,
        },
        {
          date: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
          amount: 1150,
          accountId: accountData.id,
        },
        {
          date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
          amount: 1150,
          accountId: accountData.id,
        },
        {
          date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
          amount: 1350,
          accountId: accountData.id,
        },
        {
          date: format(new Date(), 'yyyy-MM-dd'),
          amount: 1500,
          accountId: accountData.id,
        },
        {
          date: format(new Date(), 'yyyy-MM-dd'),
          amount: oneMoreAccountData.initialBalance,
          accountId: oneMoreAccountData.id,
        },
        {
          date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
          amount: 1400,
          accountId: accountData.id,
        },
        {
          date: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
          amount: 1400,
          accountId: accountData.id,
        },
        {
          date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
          amount: 150,
          accountId: oneMoreAccountData.id,
        },
      ]);
    });

    it("updating account's balance directly, without transactions", async () => {
      const initialBalance = 10000;
      const { accountData, currencyRate } = await buildAccount({
        accountInitialBalance: initialBalance,
        currencyCode: 'UAH',
      });

      const initialHistory = helpers.extractResponse(await callGetBalanceHistory(accountData.id));

      expect(initialHistory[0].amount).toBe(Math.floor(initialBalance * currencyRate));

      // Firstly test that balance increase works well
      await helpers.updateAccount({
        id: accountData.id,
        payload: {
          currentBalance: initialBalance + 5000,
        },
      });

      const historyIncreaseChange = helpers.extractResponse(
        await callGetBalanceHistory(accountData.id),
      );

      historyIncreaseChange.forEach((item) => {
        expect(item.amount).toBe(Math.floor((initialBalance + 5000) * currencyRate) - 1);
      });

      // Then test that balance decreate works well
      await helpers.updateAccount({
        id: accountData.id,
        payload: {
          currentBalance: 0,
        },
      });

      const historyDecreaseChange = helpers.extractResponse(
        await callGetBalanceHistory(accountData.id),
      );

      historyDecreaseChange.forEach((item) => {
        // TODO: it should be 0 but not -1, but we have calculation issues that should be fixed
        // it doesn't affect anything btw, only the history has some issues
        expect(item.amount).toBe(-1);
      });
    });

    it("updating a transaction with the same amount shouldn't affect the balance", async () => {
      // Initial setup: create an account and transaction
      const initialBalance = 1000;
      const { accountData } = await buildAccount({
        accountInitialBalance: initialBalance,
      });

      // Create a transaction and verify the balance after the transaction
      const expenseAmount = 100;
      const transactionPayload = {
        ...helpers.buildTransactionPayload({ accountId: accountData.id }),
        amount: expenseAmount,
      };
      const transactionResponse = await helpers.createTransaction({
        payload: transactionPayload,
        raw: true,
      });
      const transactionId = transactionResponse[0].id;

      const initialHistory = helpers.extractResponse(await callGetBalanceHistory(accountData.id));
      expect(initialHistory[0].amount).toBe(initialBalance - expenseAmount);

      // Update the transaction with the same amount
      await helpers.updateTransaction({
        id: transactionId,
        payload: { amount: expenseAmount },
      });

      // Verify the balance is unchanged
      const updatedHistory = helpers.extractResponse(await callGetBalanceHistory(accountData.id));
      expect(updatedHistory[0].amount).toBe(initialBalance - expenseAmount);
    });

    describe('transfer transactions', () => {
      const checkBalances = async (list: { id: number; amounts: number[] }[]) => {
        const histories = await Promise.all(list.map((i) => callGetBalanceHistory(i.id, true)));
        const accounts = await Promise.all(
          list.map((i) => helpers.getAccount({ id: i.id, raw: true })),
        );

        histories.forEach((history, index) => {
          const amounts = list[index]!.amounts;
          // current account balance should be the same as the latest record in the Balances table
          expect(accounts[index]!.refCurrentBalance).toBe(amounts[amounts.length - 1]);
          expect(history.length).toBe(amounts.length);
          expect(history.every((record, index) => record.amount === amounts[index])).toBe(true);
        });
      };

      it('transfers between accounts with the same currency', async () => {
        const accountA = await helpers.createAccount({
          payload: {
            ...helpers.buildAccountPayload(),
            initialBalance: 1000,
          },
          raw: true,
        });
        const accountB = await helpers.createAccount({
          payload: {
            ...helpers.buildAccountPayload(),
            initialBalance: 100,
          },
          raw: true,
        });

        const transferPayload = {
          ...helpers.buildTransactionPayload({
            accountId: accountA.id,
            amount: 200,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
          destinationAmount: 200,
          destinationAccountId: accountB.id,
        };

        /**
         * 1. Create transfer in the same date as account creation
         */
        expect(
          (
            await helpers.createTransaction({
              payload: transferPayload,
            })
          ).statusCode,
        ).toBe(200);

        // Since we added transaction in the SAME DATE as account created,
        // records amount won't be changed
        await checkBalances([
          { id: accountA.id, amounts: [1000 - 200] },
          { id: accountB.id, amounts: [100 + 200] },
        ]);

        /**
         * 2. Create transfer on the day BEFORE account creation
         */
        expect(
          (
            await helpers.createTransaction({
              payload: {
                ...transferPayload,
                time: subDays(new Date(), 2).toISOString(),
              },
            })
          ).statusCode,
        ).toBe(200);

        // Since we added transaction BEFORE account creation, we will now have 3 records:
        // 1. Initial balance
        // 2. Transfer on the day before account creation
        // 3. Transfer on the same day as account creation from the step 1
        await checkBalances([
          { id: accountA.id, amounts: [1000, 800, 600] },
          { id: accountB.id, amounts: [100, 300, 500] },
        ]);

        /**
         * 2. Create transfer on the day AFTER account creation
         */
        expect(
          (
            await helpers.createTransaction({
              payload: {
                ...transferPayload,
                time: addDays(new Date(), 2).toISOString(),
                // Swap source and destination accounts to make transfer in another direction to add
                // more randomness to the test
                accountId: accountB.id,
                destinationAccountId: accountA.id,
              },
            })
          ).statusCode,
        ).toBe(200);

        // Since we added transaction BEFORE account creation, we will now have 3 records:
        // 1. Initial balance
        // 2. Transfer on the day BEFORE account creation
        // 3. Transfer on the SAME day as account creation from the step 1
        // 4. Transfer on the day AFTER account creation
        await checkBalances([
          { id: accountA.id, amounts: [1000, 800, 600, 800] },
          { id: accountB.id, amounts: [100, 300, 500, 300] },
        ]);
      });

      describe('different currencies', () => {
        const pairs = [
          { baseCode: 'EUR', quoteCode: 'GBP', rate: 0.84 },
          { baseCode: 'GBP', quoteCode: 'EUR', rate: 1.2 },
          { baseCode: 'USD', quoteCode: 'EUR', rate: 0.9 },
          { baseCode: 'EUR', quoteCode: 'USD', rate: 1.12 },
          { baseCode: 'USD', quoteCode: 'GBP', rate: 0.75 },
          { baseCode: 'GBP', quoteCode: 'USD', rate: 1.34 },
        ];
        let eurCurrency: UsersCurrencies;
        let gbpCurrency: UsersCurrencies;

        beforeEach(async () => {
          const { currencies } = await helpers.addUserCurrencies({
            currencyCodes: ['EUR', 'GBP'],
            raw: true,
          });
          eurCurrency = currencies[0]!;
          gbpCurrency = currencies[1]!;
          // Set static rates to make test data predictable
          await helpers.editCurrencyExchangeRate({ pairs });
        });

        const euroRate = pairs.find(
          (pair) => pair.baseCode === 'EUR' && pair.quoteCode === 'USD',
        )!.rate;
        const gbpRate = pairs.find(
          (pair) => pair.baseCode === 'GBP' && pair.quoteCode === 'USD',
        )!.rate;
        const fromEuro = (amount: number) => Math.floor(amount * euroRate);
        const fromGbp = (amount: number) => Math.floor(amount * gbpRate);

        it('transfers between accounts with different currencies', async () => {
          const initialBalance = {
            eur: {
              amount: 15000,
              refAmount: fromEuro(15000), // 16800,
            },
            gbp: {
              amount: 7500,
              refAmount: fromGbp(7500), // 10050,
            },
          };

          const accountA = await helpers.createAccount({
            payload: {
              ...helpers.buildAccountPayload(),
              initialBalance: initialBalance.eur.amount,
              currencyId: eurCurrency.currencyId,
            },
            raw: true,
          });
          const accountB = await helpers.createAccount({
            payload: {
              ...helpers.buildAccountPayload(),
              initialBalance: initialBalance.gbp.amount,
              currencyId: gbpCurrency.currencyId,
            },
            raw: true,
          });

          await checkBalances([
            { id: accountA.id, amounts: [initialBalance.eur.refAmount] },
            { id: accountB.id, amounts: [initialBalance.gbp.refAmount] },
          ]);

          const transferPayload = {
            ...helpers.buildTransactionPayload({
              accountId: accountA.id,
              amount: 2000,
              transactionType: TRANSACTION_TYPES.expense,
            }),
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationAmount: 1500,
            destinationAccountId: accountB.id,
          };

          // 1. Same day transfer
          expect(
            (
              await helpers.createTransaction({
                payload: transferPayload,
              })
            ).statusCode,
          ).toBe(200);

          await checkBalances([
            { id: accountA.id, amounts: [initialBalance.eur.refAmount - fromEuro(2000)] },
            { id: accountB.id, amounts: [initialBalance.gbp.refAmount + fromGbp(1500)] },
          ]);
          // 2. Day AFTER account creation
          expect(
            (
              await helpers.createTransaction({
                payload: {
                  ...transferPayload,
                  time: addDays(new Date(), 3).toISOString(),
                  amount: 5000,
                  destinationAmount: 4000,
                },
              })
            ).statusCode,
          ).toBe(200);

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000) - fromEuro(5000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount + fromGbp(1500),
                initialBalance.gbp.refAmount + fromGbp(1500) + fromGbp(4000),
              ],
            },
          ]);
          // // 3. Day BEFORE account creation
          expect(
            (
              await helpers.createTransaction({
                payload: {
                  ...transferPayload,
                  time: subDays(new Date(), 3).toISOString(),
                  accountId: accountB.id,
                  destinationAccountId: accountA.id,
                  amount: 1000,
                  destinationAmount: 1500,
                },
              })
            ).statusCode,
          ).toBe(200);

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount + fromEuro(1500),
                initialBalance.eur.refAmount + fromEuro(1500) - fromEuro(2000),
                initialBalance.eur.refAmount + fromEuro(1500) - fromEuro(2000) - fromEuro(5000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount - fromGbp(1000),
                initialBalance.gbp.refAmount - fromGbp(1000) + fromGbp(1500),
                initialBalance.gbp.refAmount - fromGbp(1000) + fromGbp(1500) + fromGbp(4000),
              ],
            },
          ]);
        });
        it(`[update transfers between accounts with different currencies]
          - account creation with custom initial balance
          - create transfer on the day prior account creation
          - update transfer amount to another value
          - convert transfer into expense, and back into transfer
          - convert transfer into income, and back into transfer
          – convert transfer into out_of_wallet, and back into transfer
          - delete transfer
        `, async () => {
          const initialBalance = {
            eur: {
              amount: 0,
              refAmount: fromEuro(0),
            },
            gbp: {
              amount: 1000,
              refAmount: fromGbp(1000),
            },
          };

          const accountA = await helpers.createAccount({
            payload: {
              ...helpers.buildAccountPayload(),
              initialBalance: initialBalance.eur.amount,
              currencyId: eurCurrency.currencyId,
            },
            raw: true,
          });
          const accountB = await helpers.createAccount({
            payload: {
              ...helpers.buildAccountPayload(),
              initialBalance: initialBalance.gbp.amount,
              currencyId: gbpCurrency.currencyId,
            },
            raw: true,
          });

          await checkBalances([
            { id: accountA.id, amounts: [initialBalance.eur.refAmount] },
            { id: accountB.id, amounts: [initialBalance.gbp.refAmount] },
          ]);

          const transferPayload = {
            ...helpers.buildTransactionPayload({
              accountId: accountA.id,
              amount: 2000,
              transactionType: TRANSACTION_TYPES.expense,
            }),
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationAmount: 1500,
            destinationAccountId: accountB.id,
            time: subDays(new Date(), 3).toISOString(),
          };

          const [baseTx] = await helpers.createTransaction({
            payload: transferPayload,
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                // Duplicated because of how the system works.
                // Check `#updateRecord` for more details
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount + fromGbp(1500),
                initialBalance.gbp.refAmount + fromGbp(1500),
              ],
            },
          ]);

          // Now, update transfer transaction by increasing the amount
          await helpers.updateTransaction({
            id: baseTx.id,
            payload: {
              destinationAmount: 2000,
              destinationAccountId: accountB.id,
            },
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount + fromGbp(2000),
                initialBalance.gbp.refAmount + fromGbp(2000),
              ],
            },
          ]);

          // Tranfer -> expense
          await helpers.updateTransaction({
            id: baseTx.id,
            payload: {
              transactionType: TRANSACTION_TYPES.expense,
              transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
            },
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                // System doesn't remove same records, but simply updates them
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
              ],
            },
          ]);

          // Expense -> transfer
          await helpers.updateTransaction({
            id: baseTx.id,
            payload: {
              transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
              destinationAmount: 1500,
              destinationAccountId: accountB.id,
            },
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount + fromGbp(1500),
                initialBalance.gbp.refAmount + fromGbp(1500),
              ],
            },
          ]);

          // Transfer -> income
          await helpers.updateTransaction({
            id: baseTx.id,
            payload: {
              transactionType: TRANSACTION_TYPES.income,
              transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
            },
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount + fromEuro(2000),
                initialBalance.eur.refAmount + fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
              ],
            },
          ]);

          // Income -> transfer
          await helpers.updateTransaction({
            id: baseTx.id,
            payload: {
              transactionType: TRANSACTION_TYPES.expense,
              transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
              destinationAmount: 1200,
              destinationAccountId: accountB.id,
            },
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount + fromGbp(1200),
                initialBalance.gbp.refAmount + fromGbp(1200),
              ],
            },
          ]);

          // Transfer between accounts -> transfer out of wallet
          await helpers.updateTransaction({
            id: baseTx.id,
            payload: {
              transferNature: TRANSACTION_TRANSFER_NATURE.transfer_out_wallet,
            },
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
              ],
            },
          ]);

          // Transfer out of wallet -> transfer between accounts
          await helpers.updateTransaction({
            id: baseTx.id,
            payload: {
              transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
              destinationAmount: 1300,
              destinationAccountId: accountB.id,
            },
            raw: true,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount - fromEuro(2000),
                initialBalance.eur.refAmount - fromEuro(2000),
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount + fromGbp(1300),
                initialBalance.gbp.refAmount + fromGbp(1300),
              ],
            },
          ]);

          // Delete transfer at all
          await helpers.deleteTransaction({
            id: baseTx.id,
          });

          await checkBalances([
            {
              id: accountA.id,
              amounts: [
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount,
                initialBalance.eur.refAmount,
              ],
            },
            {
              id: accountB.id,
              amounts: [
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
                initialBalance.gbp.refAmount,
              ],
            },
          ]);
        });
      });
    });
  });
});
