import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'
import { connection } from '@models/index';
import * as transactionsService from './transactions.service';
import {
  createTransaction,
  calculateNewBalance,
  deleteTransaction,
  updateTransaction,
} from './transactions.service';
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

const BASE_TX_MOCK = {
  amount: 100,
  id: 1,
  time: new Date().toISOString(),
  transactionType: TRANSACTION_TYPES.income,
  paymentType: PAYMENT_TYPES.creditCard,
  accountId: 1,
  categoryId: 1,
  currencyId: 1,
  accountType: ACCOUNT_TYPES.system,
  userId: 1,
  note: 'random',
};

const CREATED_TX_MOCK = {
  ...BASE_TX_MOCK,
  id: 1,
  fromAccountId: null,
  fromAccountType: null,
  toAccountId: null,
  toAccountType: null,
  oppositeId: null
};

const TRANSFER_TX_MOCK = {
  ...BASE_TX_MOCK,
  fromAccountId: BASE_TX_MOCK.accountId,
  fromAccountType: ACCOUNT_TYPES.system,
  toAccountId: 2,
  toAccountType: ACCOUNT_TYPES.system,
};

describe('transactions.service', () => {
  const createTransactionSpy = jest.spyOn(Transactions, 'createTransaction')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(() => Promise.resolve(CREATED_TX_MOCK as any))

  const updateTransactionByIdSpy = jest.spyOn(Transactions, 'updateTransactionById')
    .mockImplementation((passedParams) => Promise.resolve({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...CREATED_TX_MOCK as any,
      ...passedParams,
    }))

  const deleteTransactionSpy = jest.spyOn(Transactions, 'deleteTransactionById')
    .mockImplementation(() => Promise.resolve(1))

  const updateAccountSpy = jest.spyOn(accountsService, 'updateAccount')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .mockImplementation(() => ({}) as any);

  let getAccountSpy = null;
  let getTxSpy = null

  beforeEach(() => {
    jest.clearAllMocks();

    getAccountSpy = jest.spyOn(accountsService, 'getAccountById')
    getTxSpy = jest.spyOn(transactionsService, 'getTransactionById')
  });

  describe('calculates new balance for the previous balance correctly', () => {
    it.each([
      { amount: 0, previousAmount: 0, currentBalance: 0, expected: 0 },
      { amount: 10, previousAmount: 0, currentBalance: 0, expected: 10 },
      { amount: -10, previousAmount: 0, currentBalance: 0, expected: -10 },

      { amount: 0, previousAmount: -10.3, currentBalance: 0, expected: 10.3 },
      { amount: 0, previousAmount: 10, currentBalance: 0, expected: -10 },

      { amount: 0, previousAmount: 10, currentBalance: 10, expected: 0 },
    ])(
      'amount: $amount, previousAmount: $previousAmount, currentBalance: $currentBalance, expected: expected$',
      ({ amount, previousAmount, currentBalance, expected }) => {
        const newBalance = calculateNewBalance(amount, previousAmount, currentBalance);

        expect(newBalance).toBe(expected);
      },
    );
  });

  describe('transactions creation', () => {
    describe(`${TRANSACTION_TYPES.income} and ${TRANSACTION_TYPES.expense}`, () => {
      it.each([
        { balance: 0, amount: 0, expected: 0 },
        { balance: 1000, amount: 0, expected: 1000 },
        { balance: -1000, amount: 0, expected: -1000 },
        { balance: 0, amount: 1000, expected: 1000 },
        { balance: 0, amount: -1000, expected: -1000 },
      ])(
        `Account balance: $balance, tx amount: $amount, expected balance: $expected`,
        async ({ balance, amount, expected }) => {
          getAccountSpy.mockImplementation(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            () => Promise.resolve({ currentBalance: balance } as any),
          )

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
              userId: BASE_TX_MOCK.userId,
              currentBalance: expected,
            }),
            expect.anything(),
          );
          expect(result).toEqual(CREATED_TX_MOCK);
        },
      );
      it('handles error properly', async () => {
        jest.spyOn(Transactions, 'createTransaction')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementation(() => Promise.reject(new Error()))

        try {
          await createTransaction(BASE_TX_MOCK);
        } catch (e) {
          expect(rollbackMock).toBeCalled();
          expect(e).toBeInstanceOf(Error);
        }
      });
    });

    describe(`${TRANSACTION_TYPES.transfer}`, () => {
      // it.each([
      //   { balance: 0, amount: 0, expected: 0 },
      //   { balance: 1000, amount: 0, expected: 1000 },
      //   { balance: -1000, amount: 0, expected: -1000 },
      //   { balance: 0, amount: 1000, expected: 1000 },
      //   { balance: 0, amount: -1000, expected: -1000 },
      // ])(
      //   `Account balance: $balance, tx amount: $amount, expected balance: $expected`,
      //   async ({ balance, amount, expected }) => {
      //     const getAccountSpy = jest
      //       .spyOn(accountsService, 'getAccountById')
      //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //       .mockImplementation(() => Promise.resolve({ currentBalance: balance } as any))

      //     const result = await createTransaction({
      //       ...TRANSFER_TX_MOCK,
      //       amount,
      //     });

      //     expect(commitMock).toBeCalled();
      //     expect(createTransactionSpy).toBeCalled();
      //     expect(getAccountSpy).toBeCalled();
      //     expect(updateAccountSpy).toHaveBeenNthCalledWith(
      //       1,
      //       expect.objectContaining({
      //         id: TRANSFER_TX_MOCK.accountId,
      //         userId: TRANSFER_TX_MOCK.userId,
      //         currentBalance: expected,
      //       }),
      //       expect.anything(),
      //     );
      //     expect(updateAccountSpy).toHaveBeenNthCalledWith(
      //       2,
      //       expect.objectContaining({
      //         id: TRANSFER_TX_MOCK.accountId,
      //         userId: TRANSFER_TX_MOCK.userId,
      //         currentBalance: expected,
      //       }),
      //       expect.anything(),
      //     );
      //     expect(result).toEqual(CREATED_TX_MOCK);
      //   },
      // );

      it('handles error properly', async () => {
        jest.spyOn(Transactions, 'createTransaction')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .mockImplementation(() => Promise.reject(new Error()))

        try {
          await createTransaction(TRANSFER_TX_MOCK);
        } catch (e) {
          expect(rollbackMock).toBeCalled();
          expect(e).toBeInstanceOf(Error);
        }
      });
    });
  });

  describe('transaction update', () => {
    it.each([
      {
        txType: TRANSACTION_TYPES.income,
        newAmount: 100,
        oldAmount: 100,

        currentBalance: 100,
        newBalance: 0,

        newAccountCurrentBalance: 0,
        newAccountNewBalance: 100,

        previousAccountId: BASE_TX_MOCK.accountId,
        newAccountId: BASE_TX_MOCK.accountId + 1,
      },
      {
        txType: TRANSACTION_TYPES.income,
        newAmount: 100,
        oldAmount: 10,

        currentBalance: -100,
        newBalance: -110,

        newAccountCurrentBalance: 15,
        newAccountNewBalance: 115,

        previousAccountId: BASE_TX_MOCK.accountId,
        newAccountId: BASE_TX_MOCK.accountId + 1,
      },

      {
        txType: TRANSACTION_TYPES.expense,
        newAmount: -100,
        oldAmount: -100,

        currentBalance: 100,
        newBalance: 200,

        newAccountCurrentBalance: 200,
        newAccountNewBalance: 100,

        previousAccountId: BASE_TX_MOCK.accountId,
        newAccountId: BASE_TX_MOCK.accountId + 1,
      },
      {
        txType: TRANSACTION_TYPES.expense,
        newAmount: -20,
        oldAmount: -800,

        currentBalance: 1000,
        newBalance: 1800,

        newAccountCurrentBalance: -250,
        newAccountNewBalance: -270,

        previousAccountId: BASE_TX_MOCK.accountId,
        newAccountId: BASE_TX_MOCK.accountId + 1,
      },
    ])('Update both amount and account type of $txType transaction', async (
      {
        txType,
        newAmount,
        oldAmount,
        currentBalance,
        newBalance,
        newAccountCurrentBalance,
        newAccountNewBalance,
        previousAccountId,
        newAccountId
      },
    ) => {
      getAccountSpy.mockImplementation(({ id }) => {
        let balance = currentBalance

        if (id === newAccountId) {
          balance = newAccountCurrentBalance
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Promise.resolve({ currentBalance: balance } as any)
      })

      getTxSpy.mockImplementation(() => Promise.resolve({
        ...BASE_TX_MOCK,
        amount: oldAmount,
        accountId: previousAccountId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any));

      const result = await updateTransaction({
        ...BASE_TX_MOCK,
        amount: newAmount,
        transactionType: txType,
        accountId: newAccountId,
      });

      expect(commitMock).toBeCalled();
      expect(updateTransactionByIdSpy).toBeCalledTimes(1);
      expect(getAccountSpy).toBeCalled();
      expect(getTxSpy).toBeCalledWith(
        expect.objectContaining({
          id: BASE_TX_MOCK.id,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: previousAccountId,
          userId: BASE_TX_MOCK.userId,
          currentBalance: newBalance,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: newAccountId,
          userId: BASE_TX_MOCK.userId,
          currentBalance: newAccountNewBalance,
        }),
        expect.anything(),
      );
      expect(result).toEqual({
        ...CREATED_TX_MOCK,
        amount: newAmount,
        accountId: newAccountId,
        transactionType: txType,
      });
    });

    it.each([
      { txType: TRANSACTION_TYPES.income, currentBalance: 0, oldAmount: 20, newAmount: 300, newBalance: 280 },
      { txType: TRANSACTION_TYPES.income, currentBalance: 1000, oldAmount: 500, newAmount: 10, newBalance: 510 },
      { txType: TRANSACTION_TYPES.income, currentBalance: -1000, oldAmount: 500, newAmount: 100, newBalance: -1400 },

      { txType: TRANSACTION_TYPES.expense, currentBalance: 0, oldAmount: -20, newAmount: -300, newBalance: -280 },
      { txType: TRANSACTION_TYPES.expense, currentBalance: 1000, oldAmount: -500, newAmount: -10, newBalance: 1490 },
      { txType: TRANSACTION_TYPES.expense, currentBalance: -1000, oldAmount: -500, newAmount: -100, newBalance: -600 },
    ])('Update only amount and some details of $txType transaction', async (
      {
        txType,
        currentBalance,
        newAmount,
        oldAmount,
        newBalance,
      },
    ) => {
      getAccountSpy.mockImplementation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => Promise.resolve({ currentBalance } as any)
      )

      getTxSpy.mockImplementation(() => Promise.resolve({
        ...BASE_TX_MOCK,
        amount: oldAmount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any));

      const result = await updateTransaction({
        ...BASE_TX_MOCK,
        amount: newAmount,
        transactionType: txType,
      });

      expect(commitMock).toBeCalled();
      expect(updateTransactionByIdSpy).toBeCalledTimes(1);
      expect(getAccountSpy).toBeCalled();
      expect(getTxSpy).toBeCalledWith(
        expect.objectContaining({
          id: BASE_TX_MOCK.id,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toBeCalledWith(
        expect.objectContaining({
          id: BASE_TX_MOCK.accountId,
          userId: BASE_TX_MOCK.userId,
          currentBalance: newBalance,
        }),
        expect.anything(),
      );

      expect(result).toEqual({
        ...CREATED_TX_MOCK,
        amount: newAmount,
        transactionType: txType,
      });
    });

    describe('transfer', () => {
      it.todo('when amount is changed, amount should be updated for both transactions; balance of both accounts should be updated. Try different amounts');
      it.todo('when accountFrom is changed, then update tx account to a new one, update balance for new account, update balance for old account');
      it.todo('when accountTo is changed, then find opposite tx, update tx account to a new one, update balance for new account, update balance for old account');
      it.todo('when old tx type was expense/income, and the new one is transfer, then run all the transfer creation flow');
      it.todo('when old tx type was transfer, delete opposite tx, update balance of opposite account, update current tx (set null all transfer-related attrs)');
    });

    it('handles error properly', async () => {
      jest.spyOn(Transactions, 'updateTransactionById')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => Promise.reject(new Error()))

      try {
        await updateTransaction(BASE_TX_MOCK);
      } catch (e) {
        expect(rollbackMock).toBeCalled();
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe('transactions deletion', () => {
    it.each([
      { txType: TRANSACTION_TYPES.income, txAmount: 100, currentBalance: 1000, expectedBalance: 900 },
      { txType: TRANSACTION_TYPES.expense, txAmount: -100, currentBalance: 1000, expectedBalance: 1100 },
    ])(`$txType type`, async ({ txType, txAmount, currentBalance, expectedBalance }) => {
      getTxSpy.mockImplementation(() => Promise.resolve({
        ...BASE_TX_MOCK,
        amount: txAmount,
        transactionType: txType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any));

      jest
        .spyOn(accountsService, 'getAccountById')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => Promise.resolve({ currentBalance } as any))

      const result = await deleteTransaction({
        userId: BASE_TX_MOCK.userId,
        id: BASE_TX_MOCK.id,
      });

      expect(commitMock).toBeCalled();
      expect(result).toBe(undefined);
      expect(getTxSpy).toBeCalledTimes(1);
      expect(getTxSpy).toBeCalledWith(
        expect.objectContaining({
          id: BASE_TX_MOCK.id,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(deleteTransactionSpy).toBeCalledWith(
        expect.objectContaining({
          id: BASE_TX_MOCK.id,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toBeCalledWith(
        expect.objectContaining({
          id: BASE_TX_MOCK.accountId,
          userId: BASE_TX_MOCK.userId,
          currentBalance: expectedBalance,
        }),
        expect.anything(),
      );
    });

    it(`${TRANSACTION_TYPES.transfer} type`, async () => {
      const TX_AMOUNT = 100;
      const TO_ACCOUNT_ID = BASE_TX_MOCK.accountId + 1;
      const OPPOSITE_TX_ID = BASE_TX_MOCK.id + 1;
      const CURRENT_BALANCE = 1000;

      getTxSpy.mockImplementation(({ id }) => {
        const accountId = id === BASE_TX_MOCK.id ? BASE_TX_MOCK.accountId : TO_ACCOUNT_ID;

        return Promise.resolve({
          ...BASE_TX_MOCK,
          amount: TX_AMOUNT,
          accountId,
          transactionType: TRANSACTION_TYPES.transfer,
          fromAccountId: BASE_TX_MOCK.accountId,
          fromAccountType: BASE_TX_MOCK.accountType,
          toAccountId: TO_ACCOUNT_ID,
          toAccountType: BASE_TX_MOCK.accountType,
          oppositeId: OPPOSITE_TX_ID,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      })

      jest
        .spyOn(accountsService, 'getAccountById')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => Promise.resolve({ currentBalance: CURRENT_BALANCE } as any))

      const result = await deleteTransaction({
        userId: BASE_TX_MOCK.userId,
        id: BASE_TX_MOCK.id,
      });

      expect(commitMock).toBeCalled();
      expect(result).toBe(undefined);
      expect(getTxSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: BASE_TX_MOCK.id,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(getTxSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: OPPOSITE_TX_ID,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(deleteTransactionSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: BASE_TX_MOCK.id,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(deleteTransactionSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: OPPOSITE_TX_ID,
          userId: BASE_TX_MOCK.userId,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: BASE_TX_MOCK.accountId,
          userId: BASE_TX_MOCK.userId,
          currentBalance: CURRENT_BALANCE + BASE_TX_MOCK.amount,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: TO_ACCOUNT_ID,
          userId: BASE_TX_MOCK.userId,
          currentBalance: CURRENT_BALANCE - BASE_TX_MOCK.amount,
        }),
        expect.anything(),
      );
    });

    it('handles error properly', async () => {
      jest.spyOn(Transactions, 'deleteTransactionById')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => Promise.reject(new Error()))

      try {
        await deleteTransaction({ id: 1, userId: 1 });
      } catch (e) {
        expect(rollbackMock).toBeCalled();
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});
