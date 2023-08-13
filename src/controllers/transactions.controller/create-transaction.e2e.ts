import { TRANSACTION_TYPES } from 'shared-types';
import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';

describe('Create transaction controller', () => {
  it('should return validation error if no data passed', async () => {
    const res = await helpers.createTransaction({ payload: null, raw: false });

    expect(res.statusCode).toEqual(ERROR_CODES.ValidationError);
  });
  it('should successfully create a transaction base currency', async () => {
    const account = await helpers.createAccount({ raw: true });
    const txPayload = helpers.buildTransactionPayload({ accountId: account.id });
    const createdTransactions = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(createdTransactions[0].currencyId).toBe(global.BASE_CURRENCY.id);
    expect(createdTransactions[0].currencyCode).toBe(global.BASE_CURRENCY.code);
    expect(createdTransactions[0].amount).toBe(txPayload.amount);
    expect(createdTransactions[0].refAmount).toBe(txPayload.amount);
    expect(createdTransactions[0].transactionType).toBe(txPayload.transactionType);
    expect(createdTransactions[0].isTransfer).toBe(false);
    expect(createdTransactions[0]).toStrictEqual(transactions[0]);
  });
  it('should successfully create a transaction for account with currency different from base one', async () => {
    // Create account with non-default currency
    const currency = global.MODELS_CURRENCIES.find(item => item.code === 'UAH');
    await helpers.addUserCurrencies({ currencyCodes: ['UAH'] });

    const account = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currency.id,
      },
      raw: true,
    });

    const txPayload = helpers.buildTransactionPayload({ accountId: account.id });
    const createdTransactions = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });
    const currencyRate = (await helpers.getCurrenciesRates()).find(c => c.baseId === currency.id);

    expect(createdTransactions[0].currencyId).toBe(currency.id);
    expect(createdTransactions[0].currencyCode).toBe(currency.code);
    expect(createdTransactions[0].amount).toBe(txPayload.amount);
    expect(createdTransactions[0].refAmount).toBe(Math.floor(txPayload.amount * currencyRate.rate));
    expect(createdTransactions[0].transactionType).toBe(txPayload.transactionType);
    expect(createdTransactions[0].isTransfer).toBe(false);
    expect(createdTransactions[0]).toStrictEqual(transactions[0]);
  });
  it('should successfully create a transfer transaction between accounts with same currency', async () => {
    const accountA = await helpers.createAccount({ raw: true });
    const accountB = await helpers.createAccount({ raw: true });

    const defaultTxPayload = helpers.buildTransactionPayload({ accountId: accountA.id });
    const txPayload = {
      ...defaultTxPayload,
      isTransfer: true,
      destinationAmount: defaultTxPayload.amount,
      destinationAccountId: accountB.id,
    };
    const createdTransactions = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(createdTransactions[0].currencyId).toBe(global.BASE_CURRENCY.id);
    expect(createdTransactions[0].currencyCode).toBe(global.BASE_CURRENCY.code);

    expect(createdTransactions[0].amount).toBe(txPayload.amount);
    expect(createdTransactions[1].amount).toBe(txPayload.amount);

    expect(createdTransactions[0].accountId).toBe(accountA.id);
    expect(createdTransactions[1].accountId).toBe(accountB.id);

    expect(createdTransactions[0].refAmount).toBe(txPayload.amount);
    expect(createdTransactions[1].refAmount).toBe(txPayload.amount);

    expect(createdTransactions[0].isTransfer).toBe(true);
    expect(createdTransactions[1].isTransfer).toBe(true);

    // Make sure `transferId` is the same for both transactions
    expect(createdTransactions[0].transferId).toBe(createdTransactions[0].transferId);
    expect(createdTransactions[1].transferId).toBe(createdTransactions[0].transferId);

    expect(createdTransactions[0].transactionType).toBe(txPayload.transactionType);
    expect(createdTransactions[1].transactionType).toBe(
      txPayload.transactionType === TRANSACTION_TYPES.expense ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    );

    expect(createdTransactions[0]).toStrictEqual(transactions[0]);
  });
  it('should successfully create a transfer transaction between account with base and non-base currency', async () => {
    const accountA = await helpers.createAccount({ raw: true });

    const currencyB = global.MODELS_CURRENCIES.find(item => item.code === 'UAH');
    await helpers.addUserCurrencies({ currencyCodes: ['UAH'] })

    const accountB = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currencyB.id,
      },
      raw: true,
    });

    const DESTINATION_AMOUNT = 5600;
    const txPayload = {
      ...helpers.buildTransactionPayload({ accountId: accountA.id }),
      isTransfer: true,
      destinationAmount: DESTINATION_AMOUNT,
      destinationAccountId: accountB.id,
    };
    const createdTransactions = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(createdTransactions[0].currencyId).toBe(global.BASE_CURRENCY.id);
    expect(createdTransactions[0].currencyCode).toBe(global.BASE_CURRENCY.code);

    expect(createdTransactions[1].currencyId).toBe(currencyB.id);
    expect(createdTransactions[1].currencyCode).toBe(currencyB.code);

    expect(createdTransactions[0].amount).toBe(txPayload.amount);
    expect(createdTransactions[1].amount).toBe(DESTINATION_AMOUNT);

    expect(createdTransactions[0].accountId).toBe(accountA.id);
    expect(createdTransactions[1].accountId).toBe(accountB.id);

    // if `from` is base account, then `refAmount` stays the same
    expect(createdTransactions[0].refAmount).toBe(createdTransactions[0].amount);
    expect(createdTransactions[1].refAmount).toBe(createdTransactions[0].amount);

    expect(createdTransactions[0].isTransfer).toBe(true);
    expect(createdTransactions[1].isTransfer).toBe(true);

    // Make sure `transferId` is the same for both transactions
    expect(createdTransactions[0].transferId).toBe(createdTransactions[0].transferId);
    expect(createdTransactions[1].transferId).toBe(createdTransactions[0].transferId);

    expect(createdTransactions[0].transactionType).toBe(txPayload.transactionType);
    expect(createdTransactions[1].transactionType).toBe(
      txPayload.transactionType === TRANSACTION_TYPES.expense ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    );

    createdTransactions.forEach((tx, i) => {
      expect(tx).toStrictEqual(transactions[i]);
    })
  });
  it('should successfully create a transfer transaction between accounts with both non-base currencies', async () => {
    const currencyA = global.MODELS_CURRENCIES.find(item => item.code === 'EUR');
    await helpers.addUserCurrencies({ currencyCodes: [currencyA.code] })
    const accountA = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currencyA.id,
      },
      raw: true,
    });

    const currencyB = global.MODELS_CURRENCIES.find(item => item.code === 'UAH');
    await helpers.addUserCurrencies({ currencyCodes: [currencyB.code] })
    const accountB = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currencyB.id,
      },
      raw: true,
    });

    const currencyRate = (await helpers.getCurrenciesRates()).find(c => c.baseCode === currencyA.code);

    const DESTINATION_AMOUNT = 25000;
    const txPayload = {
      ...helpers.buildTransactionPayload({ accountId: accountA.id }),
      isTransfer: true,
      destinationAmount: DESTINATION_AMOUNT,
      destinationAccountId: accountB.id,
    };
    const createdTransactions = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(createdTransactions[0].currencyId).toBe(currencyA.id);
    expect(createdTransactions[0].currencyCode).toBe(currencyA.code);

    expect(createdTransactions[1].currencyId).toBe(currencyB.id);
    expect(createdTransactions[1].currencyCode).toBe(currencyB.code);

    expect(createdTransactions[0].amount).toBe(txPayload.amount);
    expect(createdTransactions[1].amount).toBe(DESTINATION_AMOUNT);

    expect(createdTransactions[0].accountId).toBe(accountA.id);
    expect(createdTransactions[1].accountId).toBe(accountB.id);

    // Secondary (`to`) transfer tx always same `refAmount` as the general (`from`) tx to keep it consistent
    expect(createdTransactions[0].refAmount).toBe(Math.floor(createdTransactions[0].amount * currencyRate.rate));
    expect(createdTransactions[1].refAmount).toBe(Math.floor(createdTransactions[0].amount * currencyRate.rate));

    expect(createdTransactions[0].isTransfer).toBe(true);
    expect(createdTransactions[1].isTransfer).toBe(true);

    // Make sure `transferId` is the same for both transactions
    expect(createdTransactions[0].transferId).toBe(createdTransactions[0].transferId);
    expect(createdTransactions[1].transferId).toBe(createdTransactions[0].transferId);

    expect(createdTransactions[0].transactionType).toBe(txPayload.transactionType);
    expect(createdTransactions[1].transactionType).toBe(
      txPayload.transactionType === TRANSACTION_TYPES.expense ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    );

    createdTransactions.forEach((tx, i) => {
      expect(tx).toStrictEqual(transactions[i]);
    })
  });
})
