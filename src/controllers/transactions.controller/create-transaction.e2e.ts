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
    const [baseTx] = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(baseTx.currencyId).toBe(global.BASE_CURRENCY.id);
    expect(baseTx.currencyCode).toBe(global.BASE_CURRENCY.code);
    expect(baseTx.amount).toBe(txPayload.amount);
    expect(baseTx.refAmount).toBe(txPayload.amount);
    expect(baseTx.transactionType).toBe(txPayload.transactionType);
    expect(baseTx.isTransfer).toBe(false);
    expect(baseTx).toStrictEqual(transactions[0]);
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
    const [baseTx] = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });
    const currencyRate = (await helpers.getCurrenciesRates()).find(c => c.baseId === currency.id);

    expect(baseTx.currencyId).toBe(currency.id);
    expect(baseTx.currencyCode).toBe(currency.code);
    expect(baseTx.amount).toBe(txPayload.amount);
    expect(baseTx.refAmount).toBe(Math.floor(txPayload.amount * currencyRate.rate));
    expect(baseTx.transactionType).toBe(txPayload.transactionType);
    expect(baseTx.isTransfer).toBe(false);
    expect(baseTx).toStrictEqual(transactions[0]);
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
    const [baseTx, oppositeTx] = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(baseTx.currencyId).toBe(global.BASE_CURRENCY.id);
    expect(baseTx.currencyCode).toBe(global.BASE_CURRENCY.code);

    expect(baseTx.amount).toBe(txPayload.amount);
    expect(oppositeTx.amount).toBe(txPayload.amount);

    expect(baseTx.accountId).toBe(accountA.id);
    expect(oppositeTx.accountId).toBe(accountB.id);

    expect(baseTx.refAmount).toBe(txPayload.amount);
    expect(oppositeTx.refAmount).toBe(txPayload.amount);

    expect(baseTx.isTransfer).toBe(true);
    expect(oppositeTx.isTransfer).toBe(true);

    // Make sure `transferId` is the same for both transactions
    expect(baseTx.transferId).toBe(baseTx.transferId);
    expect(oppositeTx.transferId).toBe(baseTx.transferId);

    expect(baseTx.transactionType).toBe(txPayload.transactionType);
    expect(oppositeTx.transactionType).toBe(
      txPayload.transactionType === TRANSACTION_TYPES.expense ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    );

    expect(baseTx).toStrictEqual(transactions[0]);
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
    const [baseTx, oppositeTx] = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(baseTx.currencyId).toBe(global.BASE_CURRENCY.id);
    expect(baseTx.currencyCode).toBe(global.BASE_CURRENCY.code);

    expect(oppositeTx.currencyId).toBe(currencyB.id);
    expect(oppositeTx.currencyCode).toBe(currencyB.code);

    expect(baseTx.amount).toBe(txPayload.amount);
    expect(oppositeTx.amount).toBe(DESTINATION_AMOUNT);

    expect(baseTx.accountId).toBe(accountA.id);
    expect(oppositeTx.accountId).toBe(accountB.id);

    // if `from` is base account, then `refAmount` stays the same
    expect(baseTx.refAmount).toBe(baseTx.amount);
    expect(oppositeTx.refAmount).toBe(baseTx.amount);

    expect(baseTx.isTransfer).toBe(true);
    expect(oppositeTx.isTransfer).toBe(true);

    // Make sure `transferId` is the same for both transactions
    expect(baseTx.transferId).toBe(baseTx.transferId);
    expect(oppositeTx.transferId).toBe(baseTx.transferId);

    expect(baseTx.transactionType).toBe(txPayload.transactionType);
    expect(oppositeTx.transactionType).toBe(
      txPayload.transactionType === TRANSACTION_TYPES.expense ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    );

    [baseTx, oppositeTx].forEach((tx, i) => {
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
    const oppositeCurrencyRate = (await helpers.getCurrenciesRates()).find(c => c.baseCode === currencyB.code);

    const DESTINATION_AMOUNT = 25000;
    const txPayload = {
      ...helpers.buildTransactionPayload({ accountId: accountA.id }),
      isTransfer: true,
      destinationAmount: DESTINATION_AMOUNT,
      destinationAccountId: accountB.id,
    };
    const [baseTx, oppositeTx] = await helpers.createTransaction({
      payload: txPayload,
      raw: true,
    });

    const transactions = await helpers.getTransactions({ raw: true });

    expect(baseTx.currencyId).toBe(currencyA.id);
    expect(baseTx.currencyCode).toBe(currencyA.code);

    expect(oppositeTx.currencyId).toBe(currencyB.id);
    expect(oppositeTx.currencyCode).toBe(currencyB.code);

    expect(baseTx.amount).toBe(txPayload.amount);
    expect(oppositeTx.amount).toBe(DESTINATION_AMOUNT);

    expect(baseTx.accountId).toBe(accountA.id);
    expect(oppositeTx.accountId).toBe(accountB.id);

    // Secondary (`to`) transfer tx always same `refAmount` as the general (`from`) tx to keep it consistent
    expect(baseTx.refAmount).toBe(Math.floor(baseTx.amount * currencyRate.rate));
    expect(oppositeTx.refAmount).toBe(Math.floor(oppositeTx.amount * oppositeCurrencyRate.rate));

    expect(baseTx.isTransfer).toBe(true);
    expect(oppositeTx.isTransfer).toBe(true);

    // Make sure `transferId` is the same for both transactions
    expect(baseTx.transferId).toBe(baseTx.transferId);
    expect(oppositeTx.transferId).toBe(baseTx.transferId);

    expect(baseTx.transactionType).toBe(txPayload.transactionType);
    expect(oppositeTx.transactionType).toBe(
      txPayload.transactionType === TRANSACTION_TYPES.expense ? TRANSACTION_TYPES.income : TRANSACTION_TYPES.expense,
    );

    [baseTx, oppositeTx].forEach((tx, i) => {
      expect(tx).toStrictEqual(transactions[i]);
    })
  });
})
