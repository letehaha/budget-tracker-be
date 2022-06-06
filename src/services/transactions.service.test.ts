import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'
import { connection } from '@models/index';
import { createTransaction, calculateNewBalance } from './transactions.service';
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
  time: new Date().toISOString(),
  transactionType: TRANSACTION_TYPES.income,
  paymentType: PAYMENT_TYPES.creditCard,
  accountId: 1,
  categoryId: 1,
  currencyId: 1,
  accountType: ACCOUNT_TYPES.system,
  userId: 1,
};

const CREATED_TX_MOCK = {
  ...BASE_TX_MOCK,
  id: 1,
  note: null,
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

const createTransactionSpy = jest.spyOn(Transactions, 'createTransaction')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .mockImplementation(() => Promise.resolve(CREATED_TX_MOCK as any))

const updateAccountSpy = jest.spyOn(accountsService, 'updateAccount')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .mockImplementation(() => ({}) as any);

describe('transactions.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
          const getAccountSpy = jest
            .spyOn(accountsService, 'getAccountById')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .mockImplementation(() => Promise.resolve({ currentBalance: balance } as any))

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
});
