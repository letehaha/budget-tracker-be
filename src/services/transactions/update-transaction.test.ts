/* eslint-disable @typescript-eslint/no-explicit-any */

import { TRANSACTION_TYPES, PAYMENT_TYPES, ACCOUNT_TYPES } from 'shared-types'
import { connection } from '@models/index';
import * as getTransactionByIdService from './get-by-id';
import { updateTransaction } from './update-transaction';
// import TransactionsModel from '@models/Transactions.model';
import * as Transactions from '@models/Transactions.model';
import * as Accounts from '@models/Accounts.model';
import * as accountsService from '@services/accounts.service';

const commitMock = jest.fn().mockImplementation(() => Promise.resolve());
const rollbackMock = jest.fn().mockImplementation(() => Promise.resolve());

jest.spyOn(connection.sequelize, 'transaction').mockImplementation(
  () => Promise.resolve({
    commit: commitMock,
    rollback: rollbackMock,
  })
);

const DEFAULT_CURRENCY = {
  id: 868,
  code: 'USD',
}

const EXISTING_BASE_TX_MOCK = {
  id: 1,
  amount: 100,
  refAmount: 100,
  time: new Date(),
  transactionType: TRANSACTION_TYPES.expense,
  paymentType: PAYMENT_TYPES.creditCard,
  accountId: 1,
  categoryId: 1,
  currencyId: DEFAULT_CURRENCY.id,
  currencyCode: DEFAULT_CURRENCY.code,
  accountType: ACCOUNT_TYPES.system,
  refCurrencyCode: null,
  authorId: 1,
  note: 'random',
  isTransfer: false,
  transferId: null,
};

// const EXISTING_BASE_TRANSFER_TX_MOCK = {
//   ...EXISTING_BASE_TX_MOCK,
//   transactionType: TRANSACTION_TYPES.expense,
//   accountId: 1,
//   isTransfer: true,
//   transferId: 'random-hash',
// };

// const EXISTING_OPPOSITE_TRANSFER_TX_MOCK = {
//   ...EXISTING_BASE_TRANSFER_TX_MOCK,
//   id: EXISTING_BASE_TX_MOCK.id + 1,
//   transactionType: TRANSACTION_TYPES.income,
//   accountId: EXISTING_BASE_TRANSFER_TX_MOCK.accountId + 1,
// };

describe('transactions.service', () => {
  const updateTransactionByIdSpy = jest.spyOn(Transactions, 'updateTransactionById');

  const updateAccountSpy = jest
    .spyOn(accountsService, 'updateAccount')
    .mockImplementation(() => ({}) as any);

  let getAccountSpy = null;
  let getAccountCurrencySpy = null;
  let getTxSpy = null

  beforeEach(() => {
    jest.clearAllMocks();

    getAccountSpy = jest.spyOn(accountsService, 'getAccountById')
    getAccountCurrencySpy = jest.spyOn(Accounts, 'getAccountCurrency');
    getTxSpy = jest.spyOn(getTransactionByIdService, 'getTransactionById')

    updateTransactionByIdSpy
      .mockImplementation((passedParams) => Promise.resolve({
        ...EXISTING_BASE_TX_MOCK as any,
        ...passedParams,
      }))
  });

  describe('transaction update', () => {
    it.each([
      // Change account for income transaction with no amount change
      {
        newTxType: TRANSACTION_TYPES.income,
        oldTxType: TRANSACTION_TYPES.income,

        newAmount: 100,
        oldAmount: 100,

        currentBalance: 100,
        newBalance: 0,

        newAccountCurrentBalance: 0,
        newAccountNewBalance: 100,

        previousAccountId: EXISTING_BASE_TX_MOCK.accountId,
        newAccountId: EXISTING_BASE_TX_MOCK.accountId + 1,
      },
      // Change account for income transaction with amount change
      {
        newTxType: TRANSACTION_TYPES.income,
        oldTxType: TRANSACTION_TYPES.income,

        newAmount: 100,
        oldAmount: 10,

        currentBalance: -100,
        newBalance: -110,

        newAccountCurrentBalance: 15,
        newAccountNewBalance: 115,

        previousAccountId: EXISTING_BASE_TX_MOCK.accountId,
        newAccountId: EXISTING_BASE_TX_MOCK.accountId + 1,
      },
      // Change account for expense transaction with no amount change
      {
        newTxType: TRANSACTION_TYPES.expense,
        oldTxType: TRANSACTION_TYPES.expense,

        newAmount: 100,
        oldAmount: 100,

        currentBalance: 100,
        newBalance: 200,

        newAccountCurrentBalance: 200,
        newAccountNewBalance: 100,

        previousAccountId: EXISTING_BASE_TX_MOCK.accountId,
        newAccountId: EXISTING_BASE_TX_MOCK.accountId + 1,
      },
      // Change account for expense transaction with amount change
      {
        newTxType: TRANSACTION_TYPES.expense,
        oldTxType: TRANSACTION_TYPES.expense,

        newAmount: 20,
        oldAmount: 800,

        currentBalance: 1000,
        newBalance: 1800,

        newAccountCurrentBalance: -250,
        newAccountNewBalance: -270,

        previousAccountId: EXISTING_BASE_TX_MOCK.accountId,
        newAccountId: EXISTING_BASE_TX_MOCK.accountId + 1,
      },
      // Change tx type from income to expense for the same account
      {
        newTxType: TRANSACTION_TYPES.income,
        oldTxType: TRANSACTION_TYPES.expense,

        newAmount: 50,
        oldAmount: 100,

        // We need to duplicate values because account isn't changed
        currentBalance: 400,
        newAccountCurrentBalance: 400,
        newBalance: 550,
        newAccountNewBalance: 550,

        previousAccountId: EXISTING_BASE_TX_MOCK.accountId,
        newAccountId: EXISTING_BASE_TX_MOCK.accountId,
      },
      // Change tx type from income to expense and change accounts
      {
        newTxType: TRANSACTION_TYPES.income,
        oldTxType: TRANSACTION_TYPES.expense,

        newAmount: 25,
        oldAmount: 50,

        currentBalance: 400,
        newBalance: 450,

        newAccountCurrentBalance: -250,
        newAccountNewBalance: -225,

        previousAccountId: EXISTING_BASE_TX_MOCK.accountId,
        newAccountId: EXISTING_BASE_TX_MOCK.accountId + 1,
      },
      // Change tx type from expense to income and change accounts
      {
        newTxType: TRANSACTION_TYPES.expense,
        oldTxType: TRANSACTION_TYPES.income,

        newAmount: 25,
        oldAmount: 50,

        currentBalance: 400,
        newBalance: 350,

        newAccountCurrentBalance: -250,
        newAccountNewBalance: -275,

        previousAccountId: EXISTING_BASE_TX_MOCK.accountId,
        newAccountId: EXISTING_BASE_TX_MOCK.accountId + 1,
      },
    ])('Update income/expense transactions', async (
      {
        newTxType,
        oldTxType,
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
      const isAccountChanged = previousAccountId !== newAccountId
      getAccountSpy.mockImplementation(({ id }) => {
        let balance = currentBalance;

        if (id === newAccountId) {
          balance = newAccountCurrentBalance;
        }

        return Promise.resolve({ currentBalance: balance } as any)
      })

      getAccountCurrencySpy.mockImplementation(
        () => Promise.resolve({ currency: DEFAULT_CURRENCY } as any),
      );

      getTxSpy.mockImplementation(() => {
        const toReturn = {
          ...EXISTING_BASE_TX_MOCK,
          amount: oldAmount,
          transactionType: oldTxType,
          accountId: previousAccountId,
        };

        return Promise.resolve(toReturn as any);
      })

      const result = await updateTransaction({
        ...EXISTING_BASE_TX_MOCK,
        amount: newAmount,
        transactionType: newTxType,
        accountId: newAccountId,
      });

      expect(commitMock).toBeCalled();
      expect(updateTransactionByIdSpy).toBeCalledTimes(isAccountChanged ? 2 : 1);
      expect(getAccountSpy).toBeCalled();
      expect(getTxSpy).toBeCalledWith(
        expect.objectContaining({
          id: EXISTING_BASE_TX_MOCK.id,
          authorId: EXISTING_BASE_TX_MOCK.authorId,
        }),
        expect.anything(),
      );
      expect(updateAccountSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: previousAccountId,
          userId: EXISTING_BASE_TX_MOCK.authorId,
          currentBalance: newBalance,
        }),
        expect.anything(),
      );
      // If test case is about the same account, we didn't expect updateAccountSpy
      // to be called second time
      if (previousAccountId !== newAccountId) {
        expect(updateAccountSpy).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            id: newAccountId,
            userId: EXISTING_BASE_TX_MOCK.authorId,
            currentBalance: newAccountNewBalance,
          }),
          expect.anything(),
        );
      }
      expect(result).toEqual(
        [
          {
            ...EXISTING_BASE_TX_MOCK,
            amount: newAmount,
            refAmount: newAmount,
            accountId: newAccountId,
            transactionType: newTxType,
          },
        ],
      );
    });

    // it.each([
    //   {
    //     oldAmount: 100,
    //     newAmount: 10,

    //     fromAccountBalanceBefore: -100,
    //     fromAccountBalanceAfter: -10,

    //     toAccountBalanceBefore: 100,
    //     toAccountBalanceAfter: 10,

    //     fromAccountId: CREATED_TRANSFER_TX_MOCK.fromAccountId,
    //     toAccountId: CREATED_TRANSFER_TX_MOCK.toAccountId,
    //   },
    //   {
    //     oldAmount: 10,
    //     newAmount: 100,

    //     fromAccountBalanceBefore: -10,
    //     fromAccountBalanceAfter: -100,

    //     toAccountBalanceBefore: 10,
    //     toAccountBalanceAfter: 100,

    //     fromAccountId: CREATED_TRANSFER_TX_MOCK.fromAccountId,
    //     toAccountId: CREATED_TRANSFER_TX_MOCK.toAccountId,
    //   },
    // ])(`${TRANSACTION_TYPES.transfer}. Updates amount and changes accounts balances`, async (
    //   {
    //     newAmount,
    //     oldAmount,

    //     fromAccountBalanceBefore,
    //     fromAccountBalanceAfter,

    //     toAccountBalanceBefore,
    //     toAccountBalanceAfter,

    //     fromAccountId,
    //     toAccountId,
    //   }
    // ) => {
    //   getTxSpy.mockImplementation(({ id }) => {
    //     let accountId = fromAccountId

    //     if (id === CREATED_TRANSFER_TX_MOCK.oppositeId) {
    //       accountId = toAccountId
    //     }

    //     return Promise.resolve({
    //       ...CREATED_TRANSFER_TX_MOCK,
    //       amount: oldAmount,
    //       accountId: accountId,
    //     } as any)
    // });

    //   updateTransactionByIdSpy.mockImplementation((passedParams) => Promise.resolve({
    //     ...CREATED_TRANSFER_TX_MOCK as any,
    //     ...passedParams,
    //   }));

    //   getAccountSpy.mockImplementation(({ id }) => {
    //     let balance = fromAccountBalanceBefore;

    //     if (id === toAccountId) {
    //       balance = toAccountBalanceBefore;
    //     }

    //     return Promise.resolve({ currentBalance: balance } as any)
    //   });

    //   const result = await updateTransaction({
    //     ...TRANSFER_TX_MOCK,
    //     amount: newAmount,
    //   });

    //   expect(commitMock).toBeCalled();
    //   expect(getAccountSpy).toBeCalled();
    //   expect(updateAccountSpy).toHaveBeenNthCalledWith(
    //     1,
    //     expect.objectContaining({
    //       id: fromAccountId,
    //       userId: TRANSFER_TX_MOCK.userId,
    //       currentBalance: fromAccountBalanceAfter,
    //     }),
    //     expect.anything(),
    //   );
    //   expect(updateAccountSpy).toHaveBeenNthCalledWith(
    //     2,
    //     expect.objectContaining({
    //       id: toAccountId,
    //       userId: TRANSFER_TX_MOCK.userId,
    //       currentBalance: toAccountBalanceAfter,
    //     }),
    //     expect.anything(),
    //   );

    //   expect((result as TransactionsModel[]).length).toEqual(2);
    // });

    // describe('transfer', () => {
    //   it.todo('when accountFrom is changed, then update tx account to a new one, update balance for new account, update balance for old account');
    //   it.todo('when accountTo is changed, then find opposite tx, update tx account to a new one, update balance for new account, update balance for old account');
    //   it.todo('when old tx type was expense/income, and the new one is transfer, then run all the transfer creation flow');
    //   it.todo('when old tx type was transfer, delete opposite tx, update balance of opposite account, update current tx (set null all transfer-related attrs)');
    // });

    it('handles error properly', async () => {
      jest
        .spyOn(Transactions, 'updateTransactionById')
        .mockImplementation(() => Promise.reject(new Error()))

      try {
        await updateTransaction(EXISTING_BASE_TX_MOCK);
      } catch (e) {
        expect(rollbackMock).toBeCalled();
        expect(e).toBeInstanceOf(Error);
      }
    });
  });
});
