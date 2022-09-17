/* eslint-disable @typescript-eslint/no-explicit-any */

import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'
import { connection } from '@models/index';
import * as getByIdService from './get-by-id';
import { deleteTransaction } from './delete-transaction';
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

const EXISTING_BASE_TX_MOCK = {
  id: 1,
  amount: 100,
  refAmount: 100,
  time: new Date(),
  transactionType: TRANSACTION_TYPES.expense,
  paymentType: PAYMENT_TYPES.creditCard,
  accountId: 1,
  categoryId: 1,
  currencyId: 1,
  currencyCode: 'USD',
  accountType: ACCOUNT_TYPES.system,
  refCurrencyCode: null,
  authorId: 1,
  note: 'random',
  isTransfer: false,
  transferId: null,
};

const EXISTING_BASE_TRANSFER_TX_MOCK = {
  ...EXISTING_BASE_TX_MOCK,
  transactionType: TRANSACTION_TYPES.expense,
  accountId: 1,
  isTransfer: true,
  transferId: 'random-hash',
};

const EXISTING_OPPOSITE_TRANSFER_TX_MOCK = {
  ...EXISTING_BASE_TRANSFER_TX_MOCK,
  id: EXISTING_BASE_TX_MOCK.id + 1,
  transactionType: TRANSACTION_TYPES.income,
  accountId: EXISTING_BASE_TRANSFER_TX_MOCK.accountId + 1,
};

describe('transactions.service', () => {
  const deleteTransactionSpy = jest
    .spyOn(Transactions, 'deleteTransactionById')
    .mockImplementation(() => Promise.resolve(1));

  const updateAccountSpy = jest
    .spyOn(accountsService, 'updateAccount')
    .mockImplementation(() => ({}) as any);

  let getAccountSpy = null;
  let getTxSpy = null
  let getTransactionsByArrayOfFieldMock = null

  beforeEach(() => {
    jest.clearAllMocks();

    getAccountSpy = jest.spyOn(accountsService, 'getAccountById')
    getTxSpy = jest.spyOn(getByIdService, 'getTransactionById')
    getTransactionsByArrayOfFieldMock = jest.spyOn(Transactions, 'getTransactionsByArrayOfField')
  });

  describe('transactions deletion', () => {
    it.each([
      { txType: TRANSACTION_TYPES.income, txAmount: 100, currentBalance: 1000, expectedBalance: 900 },
      { txType: TRANSACTION_TYPES.expense, txAmount: 100, currentBalance: 1000, expectedBalance: 1100 },
    ])(`"$txType" transaction`, async ({ txType, txAmount, currentBalance, expectedBalance }) => {
      getTxSpy.mockImplementation(() => Promise.resolve({
        ...EXISTING_BASE_TX_MOCK,
        amount: txAmount,
        transactionType: txType,
      } as any));

      getAccountSpy.mockImplementation(
        () => Promise.resolve({ currentBalance } as any),
      );

      const result = await deleteTransaction({
        authorId: EXISTING_BASE_TX_MOCK.authorId,
        id: EXISTING_BASE_TX_MOCK.id,
      });

      expect(commitMock).toBeCalled();
      expect(result).toBe(undefined);
      expect(getTxSpy).toBeCalledTimes(1);
      expect(getTxSpy).toBeCalledWith(
        expect.objectContaining({
          id: EXISTING_BASE_TX_MOCK.id,
          authorId: EXISTING_BASE_TX_MOCK.authorId,
        }),
        expect.anything(),
      );
      expect(deleteTransactionSpy).toBeCalledWith(
        expect.objectContaining({
          id: EXISTING_BASE_TX_MOCK.id,
          authorId: EXISTING_BASE_TX_MOCK.authorId,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toBeCalledWith(
        expect.objectContaining({
          id: EXISTING_BASE_TX_MOCK.accountId,
          userId: EXISTING_BASE_TX_MOCK.authorId,
          currentBalance: expectedBalance,
        }),
        expect.anything(),
      );
    });

    it('"transfer" type', async () => {
      const CURRENT_ACCOUNT_BALANCE = 1000;

      getTxSpy.mockImplementation(() => Promise.resolve(EXISTING_BASE_TRANSFER_TX_MOCK as any));
      getTransactionsByArrayOfFieldMock.mockImplementation(
        () => Promise.resolve([EXISTING_BASE_TRANSFER_TX_MOCK, EXISTING_OPPOSITE_TRANSFER_TX_MOCK] as any)
      );
      getAccountSpy.mockImplementation(
        () => Promise.resolve({ currentBalance: CURRENT_ACCOUNT_BALANCE } as any),
      );

      const result = await deleteTransaction({
        authorId: EXISTING_BASE_TRANSFER_TX_MOCK.authorId,
        id: EXISTING_BASE_TRANSFER_TX_MOCK.id,
      });

      expect(commitMock).toBeCalled();
      expect(result).toBe(undefined);
      expect(getTxSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: EXISTING_BASE_TRANSFER_TX_MOCK.id,
          authorId: EXISTING_BASE_TRANSFER_TX_MOCK.authorId,
        }),
        expect.anything(),
      );
      expect(deleteTransactionSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: EXISTING_BASE_TRANSFER_TX_MOCK.id,
          authorId: EXISTING_BASE_TRANSFER_TX_MOCK.authorId,
        }),
        expect.anything(),
      );
      expect(deleteTransactionSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: EXISTING_OPPOSITE_TRANSFER_TX_MOCK.id,
          authorId: EXISTING_OPPOSITE_TRANSFER_TX_MOCK.authorId,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: EXISTING_BASE_TRANSFER_TX_MOCK.accountId,
          userId: EXISTING_BASE_TRANSFER_TX_MOCK.authorId,
          currentBalance: CURRENT_ACCOUNT_BALANCE + EXISTING_BASE_TRANSFER_TX_MOCK.amount,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: EXISTING_OPPOSITE_TRANSFER_TX_MOCK.accountId,
          userId: EXISTING_OPPOSITE_TRANSFER_TX_MOCK.authorId,
          currentBalance: CURRENT_ACCOUNT_BALANCE - EXISTING_OPPOSITE_TRANSFER_TX_MOCK.amount,
        }),
        expect.anything(),
      );
    });

    it('handles error properly', async () => {
      jest
        .spyOn(Transactions, 'deleteTransactionById')
        .mockImplementation(() => Promise.reject(new Error()))

      try {
        await deleteTransaction({
          id: EXISTING_BASE_TX_MOCK.id,
          authorId: EXISTING_BASE_TX_MOCK.authorId,
        });
      } catch (e) {
        expect(rollbackMock).toBeCalled();
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});
