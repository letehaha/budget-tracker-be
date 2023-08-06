/* eslint-disable @typescript-eslint/no-explicit-any */
import { ACCOUNT_TYPES, TRANSACTION_TYPES } from 'shared-types';
import { format, addDays, subDays, startOfDay } from 'date-fns';
import Transactions from '@models/Transactions.model';
import Balances from '@models/Balances.model';
import Accounts from '@models/Accounts.model';
import { makeRequest, extractResponse } from '@tests/helpers';

const callGetBalanceHistory = async (accountId, raw = false) => {
  const result = await makeRequest({
    method: 'get',
    url: '/stats/balance-history',
    payload: {
      accountId,
    },
  });

  return raw ? extractResponse(result) : result
}
const callGelFullBalanceHistory = async (raw = false) => {
  const result = await makeRequest({
    method: 'get',
    url: '/stats/balance-history',
  });

  return raw ? extractResponse(result) : result
}

describe('Balances model', () => {
  const baseCurrencyId = 2
  const buildAccountPayload = (overrides = {}) => ({
    accountTypeId: 1,
    currencyId: baseCurrencyId,
    name: 'test',
    type: ACCOUNT_TYPES.system,
    currentBalance: 0,
    creditLimit: 0,
    ...overrides,
  })

  const buildTransactionPayload = ({ accountId, type = TRANSACTION_TYPES.expense }) => ({
    accountId,
    amount: 1000,
    categoryId: 1,
    isTransfer: false,
    paymentType: 'creditCard',
    time: startOfDay(new Date()),
    transactionType: type,
    type: ACCOUNT_TYPES.system,
  })

  it('the balances table correctly managing account creation', async () => {
    const accountResult = await makeRequest({
      method: 'post',
      url: '/accounts',
      payload: buildAccountPayload(),
    })

    const balancesHistory = await callGetBalanceHistory(extractResponse(accountResult).id);

    const result = extractResponse(balancesHistory)

    expect(balancesHistory.statusCode).toEqual(200);
    expect(result[0].amount).toEqual(extractResponse(accountResult).initialBalance);
  })

  describe('the balances history table correctly updated when:', () => {
    const buildAccount = async (
      { accountInitialBalance = 0 } = {}
    ) => {
      const accountResult = await makeRequest({
        method: 'post',
        url: '/accounts',
        payload: buildAccountPayload({
          initialBalance: accountInitialBalance,
          currentBalance: accountInitialBalance,
        }),
      });

      const accountResponse = extractResponse(accountResult);
      expect(accountResponse.initialBalance).toBe(accountInitialBalance);

      const expense = buildTransactionPayload({ accountId: accountResponse.id })
      const income = buildTransactionPayload({
        accountId: accountResponse.id,
        type: TRANSACTION_TYPES.income
      })
      const initialBalancesHistory = await callGetBalanceHistory(accountResponse.id);

      expect(initialBalancesHistory.statusCode).toEqual(200);
      expect(extractResponse(initialBalancesHistory).length).toEqual(1);
      expect(extractResponse(initialBalancesHistory)[0].amount).toEqual(accountResponse.currentBalance);

      const toReturn: {
        accountData: Accounts;
        accountResult: any;
        expense: any;
        income: any;
      } = {
        accountResult,
        accountData: accountResponse,
        expense,
        income,
      }

      return toReturn
    }

    it('– adding transactions at the same date', async () => {
      const { accountData, expense, income } = await buildAccount()

      for (const type of [expense, expense, income]) {
        await makeRequest({ method: 'post', url: '/transactions', payload: type })
      }

      const finalBalancesHistory = await callGetBalanceHistory(accountData.id);

      expect(finalBalancesHistory.statusCode).toEqual(200);
      expect(extractResponse(finalBalancesHistory).length).toEqual(1);
      expect(extractResponse(finalBalancesHistory)[0].amount).toEqual(
        // since we have 2 expenses and 1 income, we can check for 1 expense
        accountData.currentBalance - expense.amount
      );
    })

    it('– adding transactions at the same date and account has initial value', async () => {
      const { accountData, expense, income } = await buildAccount({ accountInitialBalance: 1200 })

      for (const type of [expense, expense, income]) {
        await makeRequest({ method: 'post', url: '/transactions', payload: type });
      }

      const finalBalancesHistory = await callGetBalanceHistory(accountData.id);

      expect(finalBalancesHistory.statusCode).toEqual(200);
      expect(extractResponse(finalBalancesHistory).length).toEqual(1);
      expect(extractResponse(finalBalancesHistory)[0].amount).toEqual(
        // since we have 2 expenses and 1 income, we can check for 1 expense
        accountData.currentBalance - expense.amount
      );
    })

    it(`[testing account's initialBalance]
      – creating account with custom amount
      – adding transaction for the next date
      – and then adding transaction for the prior account creation date
    `, async () => {
      const { accountData, expense, income } = await buildAccount({ accountInitialBalance: 1000 })

      // Firstly create a transaction AFTER account creation date
      await makeRequest({
        method: 'post',
        url: '/transactions',
        payload: {
          ...expense,
          time: startOfDay(addDays(new Date(), 1))
        },
      });

      const afterBalance = await callGetBalanceHistory(accountData.id, true);

      expect(afterBalance.length).toBe(2);
      expect(afterBalance.at(0).amount).toBe(accountData.initialBalance);
      expect(afterBalance.at(1).amount).toBe(accountData.initialBalance - expense.amount);

      // Then create a transaction BEFORE account creation date
      await makeRequest({
        method: 'post',
        url: '/transactions',
        payload: {
          ...income,
          time: startOfDay(subDays(new Date(), 1))
        },
      });

      const beforeBalance = await callGetBalanceHistory(accountData.id, true);

      expect(beforeBalance.length).toBe(4);
      expect(beforeBalance.at(0).amount).toBe(accountData.initialBalance);
      expect(beforeBalance.at(1).amount).toBe(accountData.initialBalance + income.amount);
      expect(beforeBalance.at(2).amount).toBe(accountData.initialBalance + income.amount);
      expect(beforeBalance.at(3).amount).toBe(accountData.initialBalance - expense.amount + income.amount);
    })

    it(`[testing account's initialBalance with transaction at that date]
      – creating account with custom amount
      – addin transaction for account creation date
      – adding transaction for the next date
      – and then adding transaction for the prior account creation date
    `, async () => {
      const { accountData, expense, income } = await buildAccount({ accountInitialBalance: 1000 })

      // Firstly create a transaction AFTER account creation date
      await makeRequest({
        method: 'post',
        url: '/transactions',
        payload: {
          ...expense,
          time: startOfDay(addDays(new Date(), 1))
        },
      });

      // Add transaction for the same day
      await makeRequest({
        method: 'post',
        url: '/transactions',
        payload: {
          ...income,
          time: startOfDay(new Date())
        },
      });

      const afterBalance = await callGetBalanceHistory(accountData.id, true);

      expect(afterBalance.length).toBe(2);
      expect(afterBalance.at(0).amount).toBe(accountData.initialBalance + income.amount);
      expect(afterBalance.at(1).amount).toBe(accountData.initialBalance - expense.amount + income.amount);

      // Then create a transaction BEFORE account creation date
      await makeRequest({
        method: 'post',
        url: '/transactions',
        payload: {
          ...income,
          time: startOfDay(subDays(new Date(), 1))
        },
      });

      const beforeBalance = await callGetBalanceHistory(accountData.id, true);

      expect(beforeBalance.length).toBe(4);
      expect(beforeBalance.at(0).amount).toBe(accountData.initialBalance);
      expect(beforeBalance.at(1).amount).toBe(accountData.initialBalance + income.amount);
      expect(beforeBalance.at(2).amount).toBe(accountData.initialBalance + income.amount + income.amount);
      expect(beforeBalance.at(3).amount).toBe(accountData.initialBalance - expense.amount + income.amount + income.amount);
    })

    it('deleting transaction', async () => {
      const { accountData, expense, income } = await buildAccount({ accountInitialBalance: 1000 })

      const transactionsPayloads = [
        { ...expense, time: startOfDay(addDays(new Date(), 1)) },
        { ...income, time: startOfDay(new Date()) },
        { ...income, time: startOfDay(subDays(new Date(), 1)) }
      ]
      const transactionResults: Transactions[] = []

      // Send 3 transactions at different days
      for (const tx of transactionsPayloads) {
        const response: Transactions[] = extractResponse(
          await makeRequest({ method: 'post', url: '/transactions', payload: tx }),
        )
        transactionResults.push(response[0]);
      }

      // Delete them
      for (const result of transactionResults.flat()) {
        await makeRequest({ method: 'delete', url: `/transactions/${result.id}`});
      }

      const finalBalanceHistory: Balances[] = await callGetBalanceHistory(accountData.id, true)

      // Since we added transaction prior account creation, we will have +1 transaction
      expect(finalBalanceHistory.length).toBe(4);
      // Check that after removing all the transactions, the initial balance is set to correct
      expect(finalBalanceHistory.every(record => record.amount === accountData.initialBalance)).toBe(true);
    })

    const mockBalanceHistory = async () => {
      const { accountData, expense, income } = await buildAccount({ accountInitialBalance: 1000 })

      // Add record for account creation date, 2 days after and 2 days before
      const transactionsPayloads = [
        { ...expense, amount: 50, time: startOfDay(subDays(new Date(), 2)) },
        { ...income, amount: 200, time: startOfDay(subDays(new Date(), 1)) },
        { ...expense, amount: 100, time: startOfDay(addDays(new Date(), 1)) },
        { ...expense, amount: 50, time: startOfDay(addDays(new Date(), 2)) },
        { ...income, amount: 150, time: new Date() },
      ]
      const transactionResults = []

      for (const tx of transactionsPayloads) {
        const response = await makeRequest({ method: 'post', url: '/transactions', payload: tx });

        transactionResults.push(...extractResponse(response));
      }

      const balanceHistory: Balances[] = await callGetBalanceHistory(accountData.id, true)

      expect(balanceHistory).toStrictEqual([
        // Since we added transaction BEFORE account creation, we will always
        // have +1 record to represent initialBalance
        { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), amount: accountData.initialBalance },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 950 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1300 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1200 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1150 },
      ])

      return {
        accountData,
        balanceHistory,
        transactionResults,
      }
    }

    it('updating transaction amount [expense & income]', async () => {
      const { accountData, transactionResults } = await mockBalanceHistory()

      // Update expense transaction
      await makeRequest({
        method: 'put',
        url: `/transactions/${transactionResults[0].id}`,
        payload: { amount: 150 },
      });

      const newBalanceHistory1: Balances[] = await callGetBalanceHistory(accountData.id, true)

      expect(newBalanceHistory1).toStrictEqual([
        { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), amount: accountData.initialBalance },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 850 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1050 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1200 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1100 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1050 },
      ])

      // Update income transaction
      await makeRequest({
        method: 'put',
        url: `/transactions/${transactionResults[1].id}`,
        payload: { amount: 350 },
      });

      const newBalanceHistory2: Balances[] = await callGetBalanceHistory(accountData.id, true)

      expect(newBalanceHistory2).toStrictEqual([
        { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), amount: accountData.initialBalance },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 850 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1200 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1350 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1250 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1200 },
      ])
    })

    it('updating transaction amount, date, transactionType and accountId', async () => {
      const { accountData, transactionResults } = await mockBalanceHistory()

      await makeRequest({
        method: 'put',
        url: `/transactions/${transactionResults[0].id}`,
        payload: {
          amount: 150,
          time: startOfDay(subDays(new Date(), 4)),
          transactionType: TRANSACTION_TYPES.income
        },
      });

      const newBalanceHistory1: Balances[] = await callGetBalanceHistory(accountData.id, true)

      expect(newBalanceHistory1).toStrictEqual([
        { date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), amount: accountData.initialBalance },
        { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1150 },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1350 },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1500 },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1400 },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1350 },
      ])

      const { accountData: oneMoreAccountData } = await buildAccount({ accountInitialBalance: 0 })

      await makeRequest({
        method: 'put',
        url: `/transactions/${transactionResults[3].id}`,
        payload: {
          amount: 150,
          time: startOfDay(addDays(new Date(), 5)),
          transactionType: TRANSACTION_TYPES.income,
          accountId: oneMoreAccountData.id,
        },
      });

      const newBalanceHistory2: Balances[] = await callGelFullBalanceHistory(true)

      // Yeah it looks really hard, but that's the way to verify everything is okay
      expect(newBalanceHistory2).toStrictEqual([
        { date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), amount: accountData.initialBalance, accountId: accountData.id },
        { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), amount: 1150, accountId: accountData.id },
        { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), amount: 1150, accountId: accountData.id },
        { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1150, accountId: accountData.id },
        { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1350, accountId: accountData.id },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: 1500, accountId: accountData.id },
        { date: format(new Date(), 'yyyy-MM-dd'), amount: oneMoreAccountData.initialBalance, accountId: oneMoreAccountData.id },
        { date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), amount: 1400, accountId: accountData.id },
        { date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), amount: 1400, accountId: accountData.id },
        { date: format(addDays(new Date(), 5), 'yyyy-MM-dd'), amount: 150, accountId: oneMoreAccountData.id },
      ])
    })

    it("updating account's balance directly, without transactions", async () => {
      const initialBalance = 1000;
      const { accountData, expense, income } = await buildAccount({ accountInitialBalance: initialBalance })

      // Firstly create a transaction AFTER account creation date
      await makeRequest({
        method: 'post',
        url: '/transactions',
        payload: {
          ...expense,
          time: startOfDay(addDays(new Date(), 1))
        },
      });

      // Then create a transaction BEFORE account creation date
      await makeRequest({
        method: 'post',
        url: '/transactions',
        payload: {
          ...income,
          time: startOfDay(subDays(new Date(), 1))
        },
      });

      const initialHistory = extractResponse(await callGetBalanceHistory(accountData.id));

      // Firstly test that balance increase on 1000 works well
      await makeRequest({
        method: 'put',
        url: `/accounts/${accountData.id}`,
        payload: {
          initialBalance: initialBalance + 1000,
        },
      });

      const historyIncreaseChange = extractResponse(await callGetBalanceHistory(accountData.id));

      historyIncreaseChange.forEach((item, index) => {
        expect(item.amount).toBe(initialHistory[index].amount + 1000);
      })

      // Then test that balance decreate on 1000 works well
      await makeRequest({
        method: 'put',
        url: `/accounts/${accountData.id}`,
        payload: {
          initialBalance,
        },
      });

      const historyDecreaseChange = extractResponse(await callGetBalanceHistory(accountData.id));

      historyDecreaseChange.forEach((item, index) => {
        expect(item.amount).toBe(initialHistory[index].amount);
      })
    });
  })
})
