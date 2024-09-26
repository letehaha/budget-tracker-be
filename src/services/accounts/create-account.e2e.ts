import * as helpers from '@tests/helpers';

describe('Create account service', () => {
  const initialBalance = 1000;
  const creditLimit = 500;

  it('should correctly create account with correct balance for default currency', async () => {
    const account = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        initialBalance,
        creditLimit,
      },
      raw: true,
    });

    expect(account.initialBalance).toStrictEqual(initialBalance);
    expect(account.refInitialBalance).toStrictEqual(initialBalance);
    expect(account.currentBalance).toStrictEqual(initialBalance);
    expect(account.refCurrentBalance).toStrictEqual(initialBalance);
    expect(account.creditLimit).toStrictEqual(creditLimit);
    expect(account.refCreditLimit).toStrictEqual(creditLimit);
  });
  it('should correctly create account with correct balance for external currency', async () => {
    const currency = (await helpers.addUserCurrencies({ currencyCodes: ['UAH'], raw: true }))
      .currencies[0]!;

    const account = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        initialBalance,
        creditLimit,
        currencyId: currency.currencyId,
      },
      raw: true,
    });

    const currencyRate = (await helpers.getCurrenciesRates({ codes: ['UAH'] }))[0];

    expect(account.initialBalance).toStrictEqual(initialBalance);
    expect(account.refInitialBalance).toStrictEqual(
      Math.floor(initialBalance * currencyRate!.rate),
    );
    expect(account.currentBalance).toStrictEqual(initialBalance);
    expect(account.refCurrentBalance).toStrictEqual(
      Math.floor(initialBalance * currencyRate!.rate),
    );
    expect(account.creditLimit).toStrictEqual(creditLimit);
    expect(account.refCreditLimit).toStrictEqual(Math.floor(creditLimit * currencyRate!.rate));
  });
});
