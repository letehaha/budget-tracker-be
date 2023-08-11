import { ERROR_CODES } from '@js/errors';
import { makeRequest, createAccount, buildTransactionPayload } from '@tests/helpers';

describe('Create transaction controller', () => {
  it('should return validation error if no data passed', async () => {
    const res = await makeRequest({
      method: 'post',
      url: '/transactions',
    });

    expect(res.statusCode).toEqual(ERROR_CODES.ValidationError);
  });
  it('should successfully create a transaction', async () => {
    const account = await createAccount({ raw: true });

    const txPayload = buildTransactionPayload({ accountId: account.id });
    const createdTransactions = await makeRequest({
      method: 'post',
      url: '/transactions',
      payload: txPayload,
      raw: true,
    });

    const transactions = await makeRequest({
      method: 'get',
      url: '/transactions',
      raw: true,
    });

    expect(createdTransactions[0].currencyId).toBe(global.BASE_CURRENCY.id);
    expect(createdTransactions[0].currencyCode).toBe(global.BASE_CURRENCY.code);
    expect(createdTransactions[0].amount).toBe(txPayload.amount);
    expect(createdTransactions[0].transactionType).toBe(txPayload.transactionType);
    expect(createdTransactions[0].isTransfer).toBe(false);
    expect(createdTransactions[0]).toStrictEqual(transactions[0]);
  });
})
