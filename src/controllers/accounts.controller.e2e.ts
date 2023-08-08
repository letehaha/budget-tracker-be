import { ACCOUNT_TYPES, API_ERROR_CODES, TRANSACTION_TYPES } from 'shared-types';
import { addDays, startOfDay } from 'date-fns';
import { faker } from '@faker-js/faker';
import { ERROR_CODES } from '@js/errors';
import { makeRequest, extractResponse } from '@tests/helpers';

const baseCurrencyId = 2
const buildAccountPayload = (overrides = {}) => ({
  accountTypeId: 1,
  currencyId: baseCurrencyId,
  name: 'test',
  type: ACCOUNT_TYPES.system,
  currentBalance: 0,
  creditLimit: 0,
  ...overrides,
});

const getAccount = (accountId) => makeRequest({
  method: 'get',
  url: `/accounts/${accountId}`,
});

const createAccount = (payload = buildAccountPayload()) => makeRequest({
  method: 'post',
  url: '/accounts',
  payload,
});

const updateAccount = (id, payload)  => makeRequest({
  method: 'put',
  url: `/accounts/${id}`,
  payload,
});

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
      const res = await makeRequest({
        method: 'put',
        url: '/accounts/1',
      });

      expect(res.statusCode).toEqual(ERROR_CODES.NotFoundError);
      expect(extractResponse(res).code).toEqual(API_ERROR_CODES.notFound);
    });

    it('should just ignore if no data passed', async () => {
      const account = extractResponse(await createAccount());
      const updatedAccount = extractResponse(await updateAccount(account.id, {}));

      expect(account).toStrictEqual(updatedAccount);
    });

    it.todo('when currencyId is changed, ref fields updated correctly');
    it('updates fields correctly', async () => {
      const newBasicFieldsValues = {
        name: 'new test',
        currencyId: 3,
      };
      const account = extractResponse(await createAccount());
      const updatedAccount = extractResponse(await updateAccount(account.id, newBasicFieldsValues));

      expect(updatedAccount).toStrictEqual({ ...account, ...newBasicFieldsValues });

      // Create 3 expense transactions with -1000 each
      for (const index in Array(3).fill(0)) {
        await createTransaction({
          ...buildTransactionPayload({ accountId: account.id }),
          time: addDays(new Date(), +index + 1),
        })
      }

      const accountAfterTxs = extractResponse(await getAccount(account.id));
      expect(accountAfterTxs.initialBalance).toBe(0);
      expect(accountAfterTxs.currentBalance).toBe(-3000);

      const accountUpdateBalance = extractResponse(await updateAccount(account.id, {
        initialBalance: -500,
      }));

      expect(accountUpdateBalance.initialBalance).toBe(-500);
      expect(accountUpdateBalance.currentBalance).toBe(-3500);
    });

    it('updates and declines monobank accounts update correctly', async () => {
      const account = extractResponse(await createAccount({
        ...buildAccountPayload(),
        type: ACCOUNT_TYPES.monobank,
      }));
      const updatedAccount = extractResponse(await updateAccount(account.id, {
        name: 'test test',
      }));

      expect(updatedAccount.name).toBe('test test');

      const brokenUpdate = await updateAccount(account.id, {
        initialBalance: 1000,
      });

      expect(brokenUpdate.statusCode).toBe(ERROR_CODES.ValidationError);
    });
  })

  describe('Create Account', () => {
    it('should successfully create an account and then retrieve it', async() =>{
      // load account types to then use one of them to create an account
      const accountTypes = extractResponse(await makeRequest({
        method: 'get',
        url: '/models/account-types',
      }));
  
      const userCurrencies = extractResponse(await makeRequest({
        method: 'get',
        url: '/user/currencies',
      }));
  
      const accountName = faker.company.name();
      
      const account = await createAccount(buildAccountPayload({
        accountTypeId: accountTypes[0].id,
        currencyId: userCurrencies[0].currencyId,
        name: accountName,
        initialBalance: 100,
        creditLimit: 1000,
      }));
  
      expect(account.statusCode).toEqual(200);
      expect(account.body.response.name).toContain(accountName);
  
      // get all accounts and check if it exists in account list
  
      const accounts = extractResponse(await makeRequest({
        method: 'get',
        url: '/accounts',
      }));
  
      expect(accounts.find(item => item.name === accountName)).not.toBe(undefined);
    })
  })
})
