import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';

describe('Create transaction controller', () => {
  it('should return validation error if no data passed', async () => {
    const res = await helpers.createTransaction();

    expect(res.statusCode).toEqual(ERROR_CODES.ValidationError);
  });
  it('should successfully create a transaction base currency', async () => {
    const account = await helpers.createAccount({ raw: true });
    const txPayload = helpers.buildTransactionPayload({ accountId: account.id });
    const createdTransactions = await helpers.makeRequest({
      method: 'post',
      url: '/transactions',
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
    await helpers.addUserCurrencies({ currencyCodes: ['UAH'] })

    const account = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currency.id,
      },
      raw: true,
    });

    const txPayload = helpers.buildTransactionPayload({ accountId: account.id });
    const createdTransactions = await helpers.makeRequest({
      method: 'post',
      url: '/transactions',
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
})
