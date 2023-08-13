import { ACCOUNT_TYPES, API_ERROR_CODES, TRANSACTION_TYPES } from 'shared-types';
import { addDays, startOfDay } from 'date-fns';
import { ERROR_CODES } from '@js/errors';
import * as helpers from '@tests/helpers';

const buildTransactionPayload = ({ accountId, type = TRANSACTION_TYPES.expense }) => ({
  accountId,
  amount: 1000,
  categoryId: 1,
  isTransfer: false,
  paymentType: 'creditCard',
  time: startOfDay(new Date()),
  transactionType: type,
  type: ACCOUNT_TYPES.system,
});

const createTransaction = (payload) => (
  helpers.makeRequest({ method: 'post', url: '/transactions', payload })
);

describe('Accounts controller', () => {
  describe('create account', () => {
    const initialBalance = 1000;
    const creditLimit = 500;

    it('should correctly create account with correct balance for default currency', async () => {
      const account = await helpers.createAccount({
        payload: {
          ...helpers.buildAccountPayload(),
          initialBalance,
          creditLimit
        },
        raw: true,
      });

      expect(account.initialBalance).toStrictEqual(initialBalance);
      expect(account.currentBalance).toStrictEqual(initialBalance);
      expect(account.refCurrentBalance).toStrictEqual(initialBalance);
      expect(account.creditLimit).toStrictEqual(creditLimit);
      expect(account.refCreditLimit).toStrictEqual(creditLimit);
    });
    it('should correctly create account with correct balance for external currency', async () => {
      const currency = (await helpers.addUserCurrencies({ currencyCodes: ['UAH'], raw: true }))[0];

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
      expect(account.currentBalance).toStrictEqual(initialBalance);
      expect(account.refCurrentBalance).toStrictEqual(Math.floor(initialBalance * currencyRate.rate));
      expect(account.creditLimit).toStrictEqual(creditLimit);
      expect(account.refCreditLimit).toStrictEqual(Math.floor(creditLimit * currencyRate.rate));
    });
  })
  describe('update account', () => {
    it('should return 404 if try to update unexisting account', async () => {
      const res = await helpers.updateAccount({
        id: 1,
      })

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

    it.todo('when currencyId is changed, ref fields updated correctly');
    it('updates fields correctly', async () => {
      const newBasicFieldsValues = {
        name: 'new test',
        currencyId: 3,
      };
      const account = await helpers.createAccount({ raw: true });
      const updatedAccount = await helpers.updateAccount({
        id: account.id,
        payload: newBasicFieldsValues,
        raw: true,
      });

      expect(updatedAccount).toStrictEqual({ ...account, ...newBasicFieldsValues });

      // Create 3 expense transactions with -1000 each
      for (const index in Array(3).fill(0)) {
        await createTransaction({
          ...buildTransactionPayload({ accountId: account.id }),
          time: addDays(new Date(), +index + 1),
        })
      }

      const accountAfterTxs = await helpers.getAccount({ id: account.id, raw: true });
      expect(accountAfterTxs.initialBalance).toBe(0);
      expect(accountAfterTxs.currentBalance).toBe(-3000);

      const accountUpdateBalance = await helpers.updateAccount({
        id: account.id,
        payload: {
          initialBalance: -500,
        },
        raw: true,
      });

      expect(accountUpdateBalance.initialBalance).toBe(-500);
      expect(accountUpdateBalance.currentBalance).toBe(-3500);
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
          initialBalance: 1000,
        },
      });

      expect(brokenUpdate.statusCode).toBe(ERROR_CODES.ValidationError);
    });
  })
})
