import { ACCOUNT_TYPES, API_ERROR_CODES } from 'shared-types';
import { addDays } from 'date-fns';
import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';

describe('Update account service', () => {
  it('should return 404 if try to update unexisting account', async () => {
    const res = await helpers.updateAccount<helpers.ErrorResponse>({
      id: 1,
    });

    expect(res.statusCode).toEqual(ERROR_CODES.NotFoundError);
    expect(helpers.extractResponse(res).code).toEqual(API_ERROR_CODES.notFound);
  });

  it('should just ignore if no data passed', async () => {
    const account = await helpers.createAccount({ raw: true });
    const updatedAccount = await helpers.updateAccount({
      id: account.id,
      payload: {},
      raw: true,
    });

    expect(account).toStrictEqual(updatedAccount);
  });

  it('updates account correctly with default user currency', async () => {
    const newBasicFieldsValues = {
      name: 'new test',
    };
    const account = await helpers.createAccount({ raw: true });
    const updatedAccount = await helpers.updateAccount({
      id: account.id,
      payload: newBasicFieldsValues,
      raw: true,
    });

    expect(updatedAccount).toStrictEqual({
      ...account,
      ...newBasicFieldsValues,
    });

    // Create 3 expense transactions with -1000 each
    for (const index in Array(3).fill(0)) {
      await helpers.createTransaction({
        payload: {
          ...helpers.buildTransactionPayload({ accountId: account.id }),
          time: addDays(new Date(), +index + 1).toISOString(),
        },
      });
    }

    const accountAfterTxs = await helpers.getAccount({
      id: account.id,
      raw: true,
    });
    expect(accountAfterTxs.initialBalance).toBe(0);
    expect(accountAfterTxs.refInitialBalance).toBe(0);
    expect(accountAfterTxs.currentBalance).toBe(-3000);
    expect(accountAfterTxs.refCurrentBalance).toBe(-3000);

    // Update account balance directly, with no tx usage. In that case balance should
    // be changed as well as initialBalance
    const accountUpdateBalance = await helpers.updateAccount({
      id: account.id,
      payload: {
        currentBalance: -500,
      },
      raw: true,
    });

    // We changed currentBalance from -3000 to -500, so it means that
    // initialbalance should be increased on 2500
    expect(accountUpdateBalance.initialBalance).toBe(2500);
    expect(accountUpdateBalance.refInitialBalance).toBe(2500);
    expect(accountUpdateBalance.currentBalance).toBe(-500);
    expect(accountUpdateBalance.refCurrentBalance).toBe(-500);
  });
  it('updates account correctly with non-default user currency', async () => {
    const newCurrency = 'UAH';
    const currency = (
      await helpers.addUserCurrencies({
        currencyCodes: [newCurrency],
        raw: true,
      })
    ).currencies[0];
    const account = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currency!.currencyId,
      },
      raw: true,
    });

    // Create 3 expense transactions with -1000 each
    for (const index in Array(3).fill(0)) {
      await helpers.createTransaction({
        payload: {
          ...helpers.buildTransactionPayload({ accountId: account.id }),
          time: addDays(new Date(), +index + 1).toISOString(),
        },
      });
    }

    const accountAfterTxs = await helpers.getAccount({
      id: account.id,
      raw: true,
    });
    expect(accountAfterTxs.initialBalance).toBe(0);
    expect(accountAfterTxs.refInitialBalance).toBe(0);
    expect(accountAfterTxs.currentBalance).toBe(-3000);
    expect(accountAfterTxs.refCurrentBalance).toBe(-72);

    // Update account balance directly, with no tx usage. In that case balance should
    // be changed as well as initialBalance
    const accountUpdateBalance = await helpers.updateAccount({
      id: account.id,
      payload: {
        currentBalance: -500,
      },
      raw: true,
    });

    // We changed currentBalance from -3000 to -500, so it means that
    // initialbalance should be increased on 2500
    expect(accountUpdateBalance.initialBalance).toBe(2500);
    expect(accountUpdateBalance.refInitialBalance).toBe(60);
    expect(accountUpdateBalance.currentBalance).toBe(-500);
    expect(accountUpdateBalance.refCurrentBalance).toBe(-12);
  });

  it('updates and declines monobank accounts update correctly', async () => {
    const account = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        type: ACCOUNT_TYPES.monobank,
      },
      raw: true,
    });
    const updatedAccount = await helpers.updateAccount({
      id: account.id,
      payload: {
        name: 'test test',
      },
      raw: true,
    });

    expect(updatedAccount.name).toBe('test test');

    const brokenUpdate = await helpers.updateAccount({
      id: account.id,
      payload: {
        currentBalance: 1000,
      },
    });

    expect(brokenUpdate.statusCode).toBe(ERROR_CODES.ValidationError);
  });
});