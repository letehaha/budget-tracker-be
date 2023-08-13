import { ACCOUNT_TYPES, API_ERROR_CODES, TRANSACTION_TYPES } from 'shared-types';
import { addDays, startOfDay } from 'date-fns';
import { ERROR_CODES } from '@js/errors';
import { makeRequest, extractResponse, createAccount, buildAccountPayload, getAccount, updateAccount } from '@tests/helpers';

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
  makeRequest({ method: 'post', url: '/transactions', payload })
);

describe('Accounts controller', () => {
  describe('update account', () => {
    it('should return 404 if try to update unexisting account', async () => {
      const res = await updateAccount({
        id: 1,
      })

      expect(res.statusCode).toEqual(ERROR_CODES.NotFoundError);
      expect(extractResponse(res).code).toEqual(API_ERROR_CODES.notFound);
    });

    it('should just ignore if no data passed', async () => {
      const account = await createAccount({ raw: true });
      const updatedAccount = await updateAccount({
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
      const account = await createAccount({ raw: true });
      const updatedAccount = await updateAccount({
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

      const accountAfterTxs = await getAccount({ id: account.id, raw: true });
      expect(accountAfterTxs.initialBalance).toBe(0);
      expect(accountAfterTxs.currentBalance).toBe(-3000);

      const accountUpdateBalance = await updateAccount({
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
      const account = await createAccount({
        payload: {
          ...buildAccountPayload(),
          type: ACCOUNT_TYPES.monobank,
        },
        raw: true,
      });
      const updatedAccount = await updateAccount({
        id: account.id,
        payload: {
          name: 'test test',
        },
        raw: true,
      });

      expect(updatedAccount.name).toBe('test test');

      const brokenUpdate = await updateAccount({
        id: account.id,
        payload: {
          initialBalance: 1000,
        },
      });

      expect(brokenUpdate.statusCode).toBe(ERROR_CODES.ValidationError);
    });
  })
})
