import { TRANSACTION_TYPES, TRANSACTION_TRANSFER_NATURE } from 'shared-types';
import * as helpers from '@tests/helpers';
import { ERROR_CODES } from '@js/errors';
import { faker } from '@faker-js/faker';
import { EXTERNAL_ACCOUNT_RESTRICTED_UPDATION_FIELDS } from '@services/transactions/update-transaction';

describe('Update transaction controller', () => {
  it('should make basic updation', async () => {
    const [baseTx] = await helpers.createTransaction({ raw: true });
    const txAmount = baseTx.amount;
    const expectedNewAmount = txAmount + 1000;

    const res = await helpers.updateTransaction({
      id: baseTx.id,
      payload: {
        amount: expectedNewAmount,
        transactionType: TRANSACTION_TYPES.income,
      },
      raw: true,
    });

    const txsAfterUpdation = await helpers.getTransactions({ raw: true });

    expect(res[0]).toStrictEqual(txsAfterUpdation[0]);
    expect(res[0].amount).toStrictEqual(expectedNewAmount);
    expect(res[0].transactionType).toStrictEqual(TRANSACTION_TYPES.income);
  });
  it('should change account (so and currency) and update refAmount correctly', async () => {
    const [createdTransaction] = await helpers.createTransaction({ raw: true });

    const { account: accountUAH, currencyRate } =
      await helpers.createAccountWithNewCurrency({ currency: 'UAH' });

    const [baseTx] = await helpers.updateTransaction({
      id: createdTransaction.id,
      payload: {
        transactionType: TRANSACTION_TYPES.income,
        accountId: accountUAH.id,
      },
      raw: true,
    });

    expect(baseTx.accountId).toStrictEqual(accountUAH.id);
    expect(baseTx.amount).toStrictEqual(createdTransaction.amount);
    expect(baseTx.refAmount).toStrictEqual(
      Math.floor(createdTransaction.amount * currencyRate.rate),
    );
  });
  it('should create transfer tx for ref + non-ref tx, and change destination non-ref account to another non-ref account', async () => {
    const baseAccount = await helpers.createAccount({ raw: true });
    const { account: accountUAH } = await helpers.createAccountWithNewCurrency({
      currency: 'UAH',
    });

    const [baseTx, oppositeTx] = await helpers.createTransaction({
      payload: {
        ...helpers.buildTransactionPayload({
          accountId: baseAccount.id,
          amount: 10,
          transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
          destinationAmount: 20,
          destinationAccountId: accountUAH.id,
        }),
      },
      raw: true,
    });

    // Even if the currencyRate between USD and UAH has a huge difference, non-ref
    // tx should always have refAmount same as ref tx in case of transfer
    expect(oppositeTx.refAmount).toEqual(baseTx.refAmount);

    const { account: accountEUR, currency: currencyEUR } =
      await helpers.createAccountWithNewCurrency({ currency: 'EUR' });
    const [, newOppositeTx] = await helpers.updateTransaction({
      id: baseTx.id,
      payload: {
        destinationAccountId: accountEUR.id,
      },
      raw: true,
    });

    expect(newOppositeTx).toMatchObject({
      // We only changed account, so amounts should stay same
      amount: oppositeTx.amount,
      refAmount: oppositeTx.refAmount,
      // accountId and currencyCode are changed
      accountId: accountEUR.id,
      currencyId: currencyEUR.id,
      currencyCode: currencyEUR.code,
    });
  });
  describe('should change expense to transfer and vice versa', () => {
    let createdTransactions = [];
    let accountA = null;
    let accountB = null;

    beforeEach(async () => {
      // Create account with a new currency
      const OLD_DESTINATION_CURRENCY = 'UAH';
      const currencyA = global.MODELS_CURRENCIES.find(
        (item) => item.code === OLD_DESTINATION_CURRENCY,
      );
      await helpers.addUserCurrencies({ currencyCodes: [currencyA.code] });
      accountA = await helpers.createAccount({
        payload: {
          ...helpers.buildAccountPayload(),
          currencyId: currencyA.id,
        },
        raw: true,
      });

      const New_DESTINATION_CURRENCY = 'EUR';
      const currencyB = global.MODELS_CURRENCIES.find(
        (item) => item.code === New_DESTINATION_CURRENCY,
      );
      await helpers.addUserCurrencies({ currencyCodes: [currencyA.code] });
      accountB = await helpers.createAccount({
        payload: {
          ...helpers.buildAccountPayload(),
          currencyId: currencyB.id,
        },
        raw: true,
      });

      const txPayload = {
        ...helpers.buildTransactionPayload({ accountId: accountA.id }),
        transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
        destinationAmount: 30,
        destinationAccountId: accountB.id,
      };
      createdTransactions = await helpers.createTransaction({
        payload: txPayload,
        raw: true,
      });
    });

    it('works with source transaction (`from`)', async () => {
      const sourceTransaction = createdTransactions[0];

      await helpers.updateTransaction({
        id: sourceTransaction.id,
        payload: {
          transactionType: TRANSACTION_TYPES.income,
        },
        raw: true,
      });

      const txsAfterUpdation = await helpers.getTransactions({ raw: true });

      expect(txsAfterUpdation.length).toBe(1);
      expect(txsAfterUpdation[0].transactionType).toBe(
        TRANSACTION_TYPES.income,
      );
      expect(txsAfterUpdation[0].transferId).toBe(null);
      expect(txsAfterUpdation[0].transferNature).toBe(
        TRANSACTION_TRANSFER_NATURE.not_transfer,
      );

      await helpers.updateTransaction({
        id: sourceTransaction.id,
        payload: {
          ...helpers.buildTransactionPayload({ accountId: accountA.id }),
          transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
          destinationAmount: 30,
          destinationAccountId: accountB.id,
        },
        raw: true,
      });

      const txsAfterUpdation2 = await helpers.getTransactions({ raw: true });

      expect(txsAfterUpdation2[0].id).toBe(sourceTransaction.id);
      // Check that after making tx transfer type, source changes from `income` to `expense`
      expect(txsAfterUpdation2[0].transactionType).toBe(
        TRANSACTION_TYPES.expense,
      );
      expect(txsAfterUpdation2[0].transferId).not.toBe(null);
      expect(txsAfterUpdation2[0].transferNature).toBe(
        TRANSACTION_TRANSFER_NATURE.common_transfer,
      );
    });
    it('disallowd to change non-source transaction', async () => {
      const destinationTransaction = createdTransactions[1];

      const response = await helpers.updateTransaction({
        id: destinationTransaction.id,
        payload: {
          transactionType: TRANSACTION_TYPES.expense,
        },
      });

      const txsAfterUpdation = await helpers.getTransactions({ raw: true });

      expect(response.statusCode).toBe(ERROR_CODES.ValidationError);
      // Check that after updation try nothing changed
      expect(createdTransactions).toStrictEqual(txsAfterUpdation);
    });
  });
  describe('test refAmount is correct when changing transfer transaction accounts to ref account', () => {
    it('EUR->UAH to EUR->USD, refAmount should be same as amount of USD. Because USD is a ref-currency', async () => {
      const { account: accountEUR } =
        await helpers.createAccountWithNewCurrency({ currency: 'EUR' });
      const { account: accountUAH } =
        await helpers.createAccountWithNewCurrency({ currency: 'UAH' });
      const accountUSD = await helpers.createAccount({ raw: true });

      const [baseTx] = await helpers.createTransaction({
        payload: {
          ...helpers.buildTransactionPayload({
            accountId: accountEUR.id,
            amount: 1000,
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationAmount: 2000,
            destinationAccountId: accountUAH.id,
          }),
        },
        raw: true,
      });

      const [updatedBaseTx, updatedOppositeTx] =
        await helpers.updateTransaction({
          id: baseTx.id,
          payload: {
            destinationAccountId: accountUSD.id,
            destinationAmount: 1000,
          },
          raw: true,
        });

      expect(updatedOppositeTx.amount).toEqual(updatedOppositeTx.refAmount);
      expect(updatedBaseTx.refAmount).toEqual(updatedOppositeTx.refAmount);
    });
    it('UAH->EUR to USD->EUR, refAmount should be same as amount of USD. Because USD is a ref-currency', async () => {
      const { account: accountEUR } =
        await helpers.createAccountWithNewCurrency({ currency: 'EUR' });
      const { account: accountUAH } =
        await helpers.createAccountWithNewCurrency({ currency: 'UAH' });
      const accountUSD = await helpers.createAccount({ raw: true });

      const [baseTx, oppositeTx] = await helpers.createTransaction({
        payload: {
          ...helpers.buildTransactionPayload({
            accountId: accountUAH.id,
            amount: 40000,
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationAmount: 1000,
            destinationAccountId: accountEUR.id,
          }),
        },
        raw: true,
      });

      // Change base tx account to USD, amount makes same as refAmount
      // opposite tx amount stays as previous, but refAmount makes same as base tx
      const [updatedBaseTx, updatedOppositeTx] =
        await helpers.updateTransaction({
          id: baseTx.id,
          payload: {
            accountId: accountUSD.id,
            amount: 2500,
          },
          raw: true,
        });

      expect(updatedBaseTx.amount).toEqual(updatedBaseTx.refAmount);
      expect(updatedOppositeTx.amount).toEqual(oppositeTx.amount);
      expect(updatedOppositeTx.refAmount).toEqual(updatedBaseTx.refAmount);
    });
  });
  describe('updates external transactions to transfer and vice versa', () => {
    it.each([[TRANSACTION_TYPES.expense], [TRANSACTION_TYPES.income]])(
      'updates from %s to transfer and back',
      async (transactionType) => {
        await helpers.monobank.pair();
        const { transactions } = await helpers.monobank.mockTransactions();

        const externalTransaction = transactions.find(
          (item) => item.transactionType === transactionType,
        );
        const accountB = await helpers.createAccount({
          raw: true,
        });

        const [baseTx, oppositeTx] = await helpers.updateTransaction({
          id: externalTransaction.id,
          payload: {
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationAccountId: accountB.id,
            destinationAmount: externalTransaction.refAmount,
          },
          raw: true,
        });
        const transferId = baseTx.transferId;

        const checkBalanceIsCorrect = async (expected) => {
          const balanceHistory = helpers.extractResponse(
            await helpers.makeRequest({
              method: 'get',
              url: '/stats/balance-history',
            }),
          );
          // Find opposite tx that should be created at the same date as the base tx
          const externalTxBalanceRecord = balanceHistory.find(
            (item) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              item.amount === (externalTransaction.externalData as any).balance,
          );
          const newTxBalanceRecord = balanceHistory.find(
            (item) =>
              item.date === externalTxBalanceRecord.date &&
              item.accountId === oppositeTx.accountId,
          );

          expect(newTxBalanceRecord.amount).toBe(
            expected === 0
              ? 0
              : oppositeTx.transactionType === TRANSACTION_TYPES.expense
              ? -expected
              : expected,
          );
        };

        expect(baseTx).toMatchObject({
          amount: externalTransaction.amount,
          refAmount: externalTransaction.refAmount,
          accountId: externalTransaction.accountId,
          transferId,
          transactionType: transactionType,
        });
        expect(oppositeTx).toMatchObject({
          amount: externalTransaction.refAmount,
          refAmount: externalTransaction.refAmount,
          transferId,
          accountId: accountB.id,
          transactionType:
            transactionType === TRANSACTION_TYPES.expense
              ? TRANSACTION_TYPES.income
              : TRANSACTION_TYPES.expense,
        });

        await checkBalanceIsCorrect(externalTransaction.refAmount);

        // Now update it back to be non-transfer one
        await helpers.updateTransaction({
          id: externalTransaction.id,
          payload: {
            transferNature: TRANSACTION_TRANSFER_NATURE.not_transfer,
          },
          raw: true,
        });

        await checkBalanceIsCorrect(0);

        const transactionsAfterUpdate = await helpers.getTransactions({
          raw: true,
        });

        // Check that opposite tx is deleted
        expect(
          transactionsAfterUpdate.find((i) => i.id === oppositeTx.id),
        ).toBe(undefined);
        // Check that base tx doesn't have transferId anymore
        expect(
          transactionsAfterUpdate.find((i) => i.id === baseTx.id).transferId,
        ).toBe(null);
      },
    );
    it('throws error when trying to make invalid actions', async () => {
      await helpers.monobank.pair();
      const { transactions } = await helpers.monobank.mockTransactions();

      const incomeTransaction = transactions.find(
        (item) => item.transactionType === TRANSACTION_TYPES.income,
      );
      const expenseTransaction = transactions.find(
        (item) => item.transactionType === TRANSACTION_TYPES.expense,
      );

      // when trying to update "transactionType" of the external account
      const result_a = await helpers.updateTransaction({
        id: incomeTransaction.id,
        payload: { transactionType: TRANSACTION_TYPES.expense },
      });
      expect(result_a.statusCode).toEqual(ERROR_CODES.ValidationError);

      const result_b = await helpers.updateTransaction({
        id: expenseTransaction.id,
        payload: { transactionType: TRANSACTION_TYPES.income },
      });
      expect(result_b.statusCode).toEqual(ERROR_CODES.ValidationError);

      const mockedData = {
        amount: faker.number.int({ max: 10000, min: 0 }),
        time: faker.date.anytime(),
        transactionType: TRANSACTION_TYPES.expense,
        accountId: faker.number.int({ max: 10000, min: 0 }),
      };

      // Trying to update some of restricted fields
      for (const field of EXTERNAL_ACCOUNT_RESTRICTED_UPDATION_FIELDS) {
        const res = await helpers.updateTransaction({
          id: expenseTransaction.id,
          payload: { [field]: mockedData[field] },
        });
        expect(res.statusCode).toEqual(ERROR_CODES.ValidationError);
      }
    });
  });
  describe('link transactions between each other', () => {
    it.each([[TRANSACTION_TYPES.expense], [TRANSACTION_TYPES.income]])(
      'update %s to transfer when linking',
      async (txType) => {
        const accountA = await helpers.createAccount({ raw: true });
        const accountB = await helpers.createAccount({ raw: true });

        const oppositeTxType =
          txType === TRANSACTION_TYPES.income
            ? TRANSACTION_TYPES.expense
            : TRANSACTION_TYPES.income;

        const [tx1] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountA.id,
            transactionType: txType,
          }),
          raw: true,
        });
        const [tx2] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountB.id,
            transactionType: oppositeTxType,
          }),
          raw: true,
        });

        await helpers.updateTransaction({
          id: tx1.id,
          payload: {
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationTransactionId: tx2.id,
          },
        });

        const txsAfterUpdation = await helpers.getTransactions({ raw: true });

        const tx1AfterUpdation = txsAfterUpdation.find(
          (item) => item.id === tx1.id,
        );
        const tx2AfterUpdation = txsAfterUpdation.find(
          (item) => item.id === tx2.id,
        );

        [
          [tx1, tx1AfterUpdation],
          [tx2, tx2AfterUpdation],
        ].forEach(([tx, txAfter]) => {
          // Expect that only transferNature and transferId were changed
          expect({ ...tx }).toEqual({
            ...txAfter,
            transferNature: expect.toBeAnythingOrNull(),
            transferId: expect.toBeAnythingOrNull(),
          });

          expect(txAfter.transferNature).toBe(
            TRANSACTION_TRANSFER_NATURE.common_transfer,
          );
          expect(txAfter.transferId).toEqual(expect.any(String));
        });

        expect(tx1AfterUpdation.transferId).toBe(tx2AfterUpdation.transferId);
      },
    );

    it.each([[TRANSACTION_TYPES.expense], [TRANSACTION_TYPES.income]])(
      'throws an error when trying to link tx from the same account',
      async (txType) => {
        const oppositeTxType =
          txType === TRANSACTION_TYPES.income
            ? TRANSACTION_TYPES.expense
            : TRANSACTION_TYPES.income;

        await helpers.monobank.pair();
        const { transactions } = await helpers.monobank.mockTransactions();

        const tx1 = transactions.find(
          (item) => item.transactionType === txType,
        );
        const tx2 = transactions.find(
          (item) => item.transactionType === oppositeTxType,
        );

        const result = await helpers.updateTransaction({
          id: tx1.id,
          payload: {
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationTransactionId: tx2.id,
          },
        });
        expect(result.statusCode).toBe(ERROR_CODES.ValidationError);
      },
    );

    it.each([[TRANSACTION_TYPES.expense], [TRANSACTION_TYPES.income]])(
      'throws an error when trying to link tx with same transactionType. test %s type',
      async (txType) => {
        const accountA = await helpers.createAccount({ raw: true });
        const accountB = await helpers.createAccount({ raw: true });

        const [tx1] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountA.id,
            transactionType: txType,
          }),
          raw: true,
        });
        const [tx2] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountB.id,
            transactionType: txType,
          }),
          raw: true,
        });

        const result = await helpers.updateTransaction({
          id: tx1.id,
          payload: {
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationTransactionId: tx2.id,
          },
        });

        expect(result.statusCode).toBe(ERROR_CODES.ValidationError);
      },
    );

    it.each([[TRANSACTION_TYPES.expense], [TRANSACTION_TYPES.income]])(
      'throws an error when trying to link to the transaction that is already a transfer. test %s type',
      async (txType) => {
        const accountA = await helpers.createAccount({ raw: true });
        const accountB = await helpers.createAccount({ raw: true });
        const accountC = await helpers.createAccount({ raw: true });

        const [tx1] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountA.id,
            transactionType: txType,
          }),
          raw: true,
        });
        const transactions = await helpers.createTransaction({
          payload: {
            ...helpers.buildTransactionPayload({
              accountId: accountB.id,
              amount: 10,
              transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
              destinationAmount: 20,
              destinationAccountId: accountC.id,
            }),
          },
          raw: true,
        });

        const expenseTx = transactions.find(
          (t) => t.transactionType === TRANSACTION_TYPES.expense,
        );
        const incomeTx = transactions.find(
          (t) => t.transactionType === TRANSACTION_TYPES.income,
        );

        const result = await helpers.updateTransaction({
          id: tx1.id,
          payload: {
            transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
            destinationTransactionId:
              txType === TRANSACTION_TYPES.income ? expenseTx.id : incomeTx.id,
          },
        });

        expect(result.statusCode).toBe(ERROR_CODES.ValidationError);
      },
    );

    it.todo(
      'update transfer of two linked transactions back to their initial state',
    );
    it.todo(
      'update transfer of two EXTERNAL linked transactions back to their initial state',
    );
  });
});
