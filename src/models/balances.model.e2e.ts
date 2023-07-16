/* eslint-disable @typescript-eslint/no-explicit-any */
import Umzug from 'umzug';
import request from 'supertest';
import path from 'path';
import { TRANSACTION_TYPES } from 'shared-types';
import { app, serverInstance, redisClient } from '@root/app';
import { connection } from '@models/index';
import { addDays, subDays, startOfDay } from 'date-fns';
import Transactions from '@models/Transactions.model';
import Balances from '@models/Balances.model';
import Accounts from '@models/Accounts.model';

// Create a new instance of Umzug with your sequelize instance and the path to your migrations
const umzug = new Umzug({
  migrations: {
    // The params that get passed to the migrations
    params: [
      connection.sequelize.getQueryInterface(),
      connection.sequelize.constructor,
    ],
    // The path to the migrations directory
    path: path.join(__dirname, '../migrations'),
    // The pattern that determines whether files are migrations
    pattern: /\.js$/,
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: connection.sequelize,
  },
});

const extractResponse = response => response.body.response;
const callGetBalanceHistory = async (accountId, token, raw = false) => {
  const result = await request(app)
    .get(`/api/v1/stats/balance-history?accountId=${accountId}`)
    .set('Authorization', token)

  return raw ? extractResponse(result) : result
}

describe('Balances model', () => {
  afterAll(() => {
    redisClient.quit();
    serverInstance.close();
  });

  let token
  const baseCurrencyId = 2
  const buildAccountPayload = (overrides = {}) => ({
    accountTypeId: 1,
    currencyId: baseCurrencyId,
    name: 'test',
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
  })

  beforeEach(async () => {
    try {
      await connection.sequelize.sync({ force: true });
      await connection.sequelize.drop({ cascade: true });
      await umzug.up();

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'test1',
          password: 'test1',
        });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'test1',
          password: 'test1',
        });

      token = extractResponse(res).token;

      await request(app)
        .post('/api/v1/user/currencies/base')
        .set('Authorization', token)
        .send({ currencyId: baseCurrencyId });
    } catch (err) {
      console.log(err)
    }
  })

  it('the balances table correctly managing account creation', async () => {
    const accountResult = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', token)
      .send(buildAccountPayload())

    const balancesHistory = await callGetBalanceHistory(extractResponse(accountResult).id, token);

    const result = extractResponse(balancesHistory)

    expect(balancesHistory.statusCode).toEqual(200);
    expect(result[0].accountId).toEqual(extractResponse(accountResult).id);
    expect(result[0].amount).toEqual(extractResponse(accountResult).currentBalance);
  })

  describe('the balances table correctly updated when:', () => {
    const buildAccount = async (
      { accountInitialBalance = 0 } = {}
    ) => {
      const accountResult = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', token)
        .send(buildAccountPayload({ currentBalance: accountInitialBalance }))

      const expense = buildTransactionPayload({ accountId: extractResponse(accountResult).id })
      const income = buildTransactionPayload({
        accountId: extractResponse(accountResult).id,
        type: TRANSACTION_TYPES.income
      })
      const initialBalancesHistory = await callGetBalanceHistory(extractResponse(accountResult).id, token);

      expect(initialBalancesHistory.statusCode).toEqual(200);
      expect(extractResponse(initialBalancesHistory).length).toEqual(1);
      expect(extractResponse(initialBalancesHistory)[0].amount).toEqual(extractResponse(accountResult).currentBalance);

      const toReturn: {
        accountData: Accounts;
        accountResult: any;
        expense: any;
        income: any;
      } = {
        accountResult,
        accountData: extractResponse(accountResult),
        expense,
        income,
      }

      return toReturn
    }

    it('– adding transactions at the same date', async () => {
      const { accountData, expense, income } = await buildAccount()

      for (const type of [expense, expense, income]) {
        await request(app)
          .post('/api/v1/transactions')
          .set('Authorization', token)
          .send(type);
      }

      const finalBalancesHistory = await callGetBalanceHistory(accountData.id, token);

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
        await request(app)
          .post('/api/v1/transactions')
          .set('Authorization', token)
          .send(type);
      }

      const finalBalancesHistory = await callGetBalanceHistory(accountData.id, token);

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
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', token)
        .send({
          ...expense,
          time: startOfDay(addDays(new Date(), 1))
        });

      const afterBalance = await callGetBalanceHistory(accountData.id, token, true);

      expect(afterBalance.length).toBe(2);
      expect(afterBalance.at(0).amount).toBe(accountData.initialBalance);
      expect(afterBalance.at(1).amount).toBe(accountData.initialBalance - expense.amount);

      // Then create a transaction BEFORE account creation date
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', token)
        .send({
          ...income,
          time: startOfDay(subDays(new Date(), 1))
        });

      const beforeBalance = await callGetBalanceHistory(accountData.id, token, true);

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
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', token)
        .send({
          ...expense,
          time: startOfDay(addDays(new Date(), 1))
        });

      // Add transaction for the same day
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', token)
        .send({
          ...income,
          time: startOfDay(new Date())
        });

      const afterBalance = await callGetBalanceHistory(accountData.id, token, true);

      expect(afterBalance.length).toBe(2);
      expect(afterBalance.at(0).amount).toBe(accountData.initialBalance + income.amount);
      expect(afterBalance.at(1).amount).toBe(accountData.initialBalance - expense.amount + income.amount);

      // Then create a transaction BEFORE account creation date
      await request(app)
        .post('/api/v1/transactions')
        .set('Authorization', token)
        .send({
          ...income,
          time: startOfDay(subDays(new Date(), 1))
        });

      const beforeBalance = await callGetBalanceHistory(accountData.id, token, true);

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
          await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', token)
            .send(tx)
        )
        transactionResults.push(response[0]);
      }

      // Delete them
      for (const result of transactionResults.flat()) {
        await request(app)
          .delete(`/api/v1/transactions/${result.id}`)
          .set('Authorization', token)
      }

      const finalBalanceHistory: Balances[] = await callGetBalanceHistory(accountData.id, token, true)

      // Since we added transaction prior account creation, we will have +1 transaction
      expect(finalBalanceHistory.length).toBe(4);
      // Check that after removing all the transactions, the initial balance is set to correct
      expect(finalBalanceHistory.every(record => record.amount === accountData.initialBalance)).toBe(true);
    })
  })
})
