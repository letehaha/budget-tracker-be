import { TRANSACTION_TYPES } from 'shared-types';
import * as helpers from '@tests/helpers';
import { ERROR_CODES } from '@js/errors';

describe('Update transaction controller', () => {
  it('should make basic updation', async () => {
    const createdTransaction = (await helpers.createTransaction({ raw: true }))[0];
    const txAmount = createdTransaction.amount;
    const expectedNewAmount = txAmount + 1000;

    const res = await helpers.updateTransaction({
      id: createdTransaction.id,
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
    // Create transaction
    const createdTransaction = (await helpers.createTransaction({ raw: true }))[0];

    // Create account with a new currency
    const ANOTHER_ACCOUNT_CURRENCY = 'UAH';
    const currencyA = global.MODELS_CURRENCIES.find(item => item.code === ANOTHER_ACCOUNT_CURRENCY);
    await helpers.addUserCurrencies({ currencyCodes: [currencyA.code] })
    const newAccount = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currencyA.id,
      },
      raw: true,
    });
    const currencyRate = (await helpers.getCurrenciesRates({ codes: [ANOTHER_ACCOUNT_CURRENCY] }))[0];

    const res = await helpers.updateTransaction({
      id: createdTransaction.id,
      payload: {
        transactionType: TRANSACTION_TYPES.income,
        accountId: newAccount.id,
      },
      raw: true,
    });

    const txsAfterUpdation = await helpers.getTransactions({ raw: true });

    expect(res[0]).toStrictEqual(txsAfterUpdation[0]);
    expect(txsAfterUpdation[0].accountId).toStrictEqual(newAccount.id);
    expect(txsAfterUpdation[0].amount).toStrictEqual(createdTransaction.amount);
    expect(txsAfterUpdation[0].refAmount).toStrictEqual(Math.floor(createdTransaction.amount * currencyRate.rate));
  });
  describe('should change expense to transfer and vice versa', () => {
    let createdTransactions = [];
    let accountA = null;
    let accountB = null;

    beforeEach(async () => {
      // Create account with a new currency
      const OLD_DESTINATION_CURRENCY = 'UAH';
      const currencyA = global.MODELS_CURRENCIES.find(item => item.code === OLD_DESTINATION_CURRENCY);
      await helpers.addUserCurrencies({ currencyCodes: [currencyA.code] })
      accountA = await helpers.createAccount({
        payload: {
          ...helpers.buildAccountPayload(),
          currencyId: currencyA.id,
        },
        raw: true,
      });

      const New_DESTINATION_CURRENCY = 'EUR';
      const currencyB = global.MODELS_CURRENCIES.find(item => item.code === New_DESTINATION_CURRENCY);
      await helpers.addUserCurrencies({ currencyCodes: [currencyA.code] })
      accountB = await helpers.createAccount({
        payload: {
          ...helpers.buildAccountPayload(),
          currencyId: currencyB.id,
        },
        raw: true,
      });

      const txPayload = {
        ...helpers.buildTransactionPayload({ accountId: accountA.id }),
        isTransfer: true,
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
      expect(txsAfterUpdation[0].transactionType).toBe(TRANSACTION_TYPES.income);
      expect(txsAfterUpdation[0].transferId).toBe(null);
      expect(txsAfterUpdation[0].isTransfer).toBe(false);

      await helpers.updateTransaction({
        id: sourceTransaction.id,
        payload: {
          ...helpers.buildTransactionPayload({ accountId: accountA.id }),
          isTransfer: true,
          destinationAmount: 30,
          destinationAccountId: accountB.id,
        },
        raw: true,
      });

      const txsAfterUpdation2 = await helpers.getTransactions({ raw: true });

      expect(txsAfterUpdation2[0].id).toBe(sourceTransaction.id);
      // Check that after making tx transfer type, source changes from `income` to `expense`
      expect(txsAfterUpdation2[0].transactionType).toBe(TRANSACTION_TYPES.expense);
      expect(txsAfterUpdation2[0].transferId).not.toBe(null);
      expect(txsAfterUpdation2[0].isTransfer).toBe(true);
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
})
