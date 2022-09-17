/* eslint-disable @typescript-eslint/no-explicit-any */

import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'
import { connection } from '@models/index';
import {
  createTransaction,
  CreateTransactionParams,
  CreateTransferTransactionParams,
} from './create-transaction';
import TransactionsModel from '@models/Transactions.model';
import * as Transactions from '@models/Transactions.model';
import * as accountsService from '@services/accounts.service';

const commitMock = jest.fn().mockImplementation(() => Promise.resolve());
const rollbackMock = jest.fn().mockImplementation(() => Promise.resolve());

jest.spyOn(connection.sequelize, 'transaction').mockImplementation(
  () => Promise.resolve({
    commit: commitMock,
    rollback: rollbackMock,
  })
);

const BASE_TX_MOCK: CreateTransactionParams = {
  amount: 100,
  time: new Date(),
  transactionType: TRANSACTION_TYPES.income,
  paymentType: PAYMENT_TYPES.creditCard,
  accountId: 1,
  categoryId: 1,
  currencyId: 1,
  currencyCode: 'USD',
  accountType: ACCOUNT_TYPES.system,
  authorId: 1,
  note: 'random',
  isTransfer: false,
};

const CREATED_TX_MOCK = {
  ...BASE_TX_MOCK,
  refAmount: BASE_TX_MOCK.amount,
  refCurrencyCode: BASE_TX_MOCK.currencyCode,
  transferId: 'random-hash',
};

const TRANSFER_TX_MOCK: CreateTransactionParams & CreateTransferTransactionParams = {
  ...BASE_TX_MOCK,
  destinationAmount: 1000,
  destinationAccountId: 2,
  destinationCurrencyId: 2,
  destinationCurrencyCode: 'USD',
  transactionType: TRANSACTION_TYPES.expense,
  isTransfer: true,
};

const CREATED_TRANSFER_TX_MOCK = {
  ...TRANSFER_TX_MOCK,
  refAmount: BASE_TX_MOCK.amount,
  refCurrencyCode: BASE_TX_MOCK.currencyCode,
  transferId: 'random-hash',
}

describe('transactions.service', () => {
  const createTransactionSpy = jest.spyOn(Transactions, 'createTransaction');

  const updateAccountSpy = jest
    .spyOn(accountsService, 'updateAccount')
    .mockImplementation(() => ({}) as any);

  let getAccountSpy = null;

  beforeEach(() => {
    jest.clearAllMocks();

    getAccountSpy = jest.spyOn(accountsService, 'getAccountById')
  });

  describe('transactions creation', () => {
    it.each([
      { txType: TRANSACTION_TYPES.income, balance: 0, amount: 0, expected: 0 },
      { txType: TRANSACTION_TYPES.income, balance: 1000, amount: 0, expected: 1000 },
      { txType: TRANSACTION_TYPES.income, balance: -1000, amount: 0, expected: -1000 },
      { txType: TRANSACTION_TYPES.income, balance: 0, amount: 1000, expected: 1000 },

      { txType: TRANSACTION_TYPES.expense, balance: 0, amount: 0, expected: 0 },
      { txType: TRANSACTION_TYPES.expense, balance: 1000, amount: 0, expected: 1000 },
      { txType: TRANSACTION_TYPES.expense, balance: -1000, amount: 0, expected: -1000 },
      { txType: TRANSACTION_TYPES.expense, balance: 0, amount: -1000, expected: -1000 },
    ])(
      `"$txType" creation. Account balance: $balance, tx amount: $amount, expected balance: $expected`,
      async ({ balance, amount, expected }) => {
        // TODO: check if it is possible to do these tests with no mocks
        getAccountSpy.mockImplementation(
          () => Promise.resolve({ currentBalance: balance } as any),
        );
        createTransactionSpy
          .mockImplementation(() => Promise.resolve({ ...CREATED_TX_MOCK, amount } as any));

        const result = await createTransaction({
          ...BASE_TX_MOCK,
          amount,
        });

        expect(commitMock).toBeCalled();
        expect(createTransactionSpy).toBeCalled();
        expect(getAccountSpy).toBeCalled();
        expect(updateAccountSpy).toBeCalledWith(
          expect.objectContaining({
            id: BASE_TX_MOCK.accountId,
            userId: BASE_TX_MOCK.authorId,
            currentBalance: expected,
          }),
          expect.anything(),
        );
        expect(result).toEqual([{ ...CREATED_TX_MOCK, amount }]);
      },
    );
    it.each([
      { txType: TRANSACTION_TYPES.income },
      { txType: TRANSACTION_TYPES.expense },
    ])('"$txType" creation error handles properly.', async ({ txType }) => {
      createTransactionSpy.mockImplementation(() => Promise.reject(new Error()))

      try {
        await createTransaction({
          ...BASE_TX_MOCK,
          transactionType: txType,
        });
      } catch (e) {
        expect(rollbackMock).toBeCalled();
        expect(e).toBeInstanceOf(Error);
      }
    });

    it.each([
      {
        amount: 20,

        fromAccountBalanceBefore: 100,
        fromAccountBalanceAfter: 80,

        toAccountBalanceBefore: 80,
        toAccountBalanceAfter: 100,

        fromAccountId: TRANSFER_TX_MOCK.accountId,
        toAccountId: TRANSFER_TX_MOCK.destinationAccountId,
      },
    ])('Transfer transaction creation.', async (
      {
        amount,
        fromAccountBalanceBefore,
        fromAccountBalanceAfter,
        toAccountBalanceBefore,
        toAccountBalanceAfter,
        fromAccountId,
        toAccountId,
      },
    ) => {
      createTransactionSpy.mockImplementation(({ accountId }) => {
        return Promise.resolve({
          ...CREATED_TRANSFER_TX_MOCK,
          amount,
          refAmount: amount,
          accountId: accountId === fromAccountId
            ? fromAccountId
            : toAccountId,
          transactionType: accountId === fromAccountId
            ? TRANSACTION_TYPES.expense
            : TRANSACTION_TYPES.income,
        } as any)
      });

      getAccountSpy.mockImplementation(({ id }) => {
        let balance = fromAccountBalanceBefore

        if (id === toAccountId) {
          balance = toAccountBalanceBefore
        }

        return Promise.resolve({ currentBalance: balance } as any)
      });

      const result = await createTransaction({
        ...TRANSFER_TX_MOCK,
        amount,
        destinationAmount: amount,
      });

      expect(commitMock).toBeCalled();
      expect(createTransactionSpy).toBeCalled();
      expect(getAccountSpy).toBeCalled();
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: fromAccountId,
          userId: TRANSFER_TX_MOCK.authorId,
          currentBalance: fromAccountBalanceAfter,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: toAccountId,
          userId: TRANSFER_TX_MOCK.authorId,
          currentBalance: toAccountBalanceAfter,
        }),
        expect.anything(),
      );
      expect((result as TransactionsModel[]).length).toEqual(2);
    });

    it('"transfer" creation error handles properly', async () => {
      createTransactionSpy.mockImplementation(() => Promise.reject(new Error()));

      try {
        await createTransaction(TRANSFER_TX_MOCK);
      } catch (e) {
        expect(rollbackMock).toBeCalled();
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});
