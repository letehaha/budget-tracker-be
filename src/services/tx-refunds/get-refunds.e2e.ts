import { TRANSACTION_TYPES } from 'shared-types';
import * as helpers from '@tests/helpers';
import { ERROR_CODES } from '@js/errors';
import type { GetRefundTransactionsParams } from './get-refunds.service';

const callCreateSingleRefund = async (
  payload: { originalTxId: number; refundTxId: number },
  raw = false,
) => {
  const result = await helpers.makeRequest({
    method: 'post',
    url: '/transactions/refund',
    payload,
  });

  return raw ? helpers.extractResponse(result) : result;
};
const callGetRefundTransactions = async (
  params: Omit<GetRefundTransactionsParams, 'userId'>,
  raw = false,
) => {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const result = await helpers.makeRequest({
    method: 'get',
    url: `/transactions/refunds?${queryString}`,
  });

  return raw ? helpers.extractResponse(result) : result;
};

describe.skip('getRefundTransactions', () => {
  describe('success cases', () => {
    it('successfully retrieves all refund transactions when no filters are applied', async () => {
      const account = await helpers.createAccount({ raw: true });
      const [originalTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.expense,
        }),
        raw: true,
      });
      const [refundTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.income,
        }),
        raw: true,
      });

      await callCreateSingleRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      const response = await callGetRefundTransactions({});

      expect(response.statusCode).toBe(200);
      expect(helpers.extractResponse(response).data.length).toBe(1);
      expect(helpers.extractResponse(response).meta.total).toBe(1);
    });

    it('successfully filters refund transactions by categoryId', async () => {
      const account = await helpers.createAccount({ raw: true });
      const [originalTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.expense,
        }),
        raw: true,
      });
      const categoryId = originalTx.categoryId;
      const [refundTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.income,
        }),
        raw: true,
      });

      await callCreateSingleRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      const response = await callGetRefundTransactions({ categoryId: categoryId });

      expect(response.statusCode).toBe(200);

      expect(helpers.extractResponse(response).data.length).toBe(1);
      expect(
        helpers
          .extractResponse(response)
          .data.every((refund) => refund.originalTransaction.categoryId === categoryId),
      ).toBe(true);
    });

    it('successfully filters refund transactions by transactionType', async () => {
      const account = await helpers.createAccount({ raw: true });
      const [originalTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.expense,
        }),
        raw: true,
      });
      const [refundTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.income,
        }),
        raw: true,
      });

      await callCreateSingleRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      const response = await callGetRefundTransactions(
        { transactionType: TRANSACTION_TYPES.expense },
        true,
      );

      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(
        response.data.every(
          (refund) => refund.originalTransaction.transactionType === TRANSACTION_TYPES.expense,
        ),
      ).toBe(true);
    });

    it('successfully filters refund transactions by accountId', async () => {
      const account = await helpers.createAccount({ raw: true });
      const [originalTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.expense,
        }),
        raw: true,
      });
      const [refundTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.income,
        }),
        raw: true,
      });

      await callCreateSingleRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      const response = await callGetRefundTransactions({ accountId: account.id }, true);

      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(
        response.data.every((refund) => refund.originalTransaction.accountId === account.id),
      ).toBe(true);
    });

    it('successfully applies multiple filters simultaneously', async () => {
      const account = await helpers.createAccount({ raw: true });
      const [originalTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.expense,
        }),
        raw: true,
      });
      const categoryId = originalTx.categoryId;
      const [refundTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.income,
        }),
        raw: true,
      });

      await callCreateSingleRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      const response = await callGetRefundTransactions(
        {
          categoryId,
          transactionType: TRANSACTION_TYPES.expense,
          accountId: account.id,
        },
        true,
      );

      expect(response.success).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(
        response.data.every(
          (refund) =>
            refund.originalTransaction.categoryId === categoryId &&
            refund.originalTransaction.transactionType === TRANSACTION_TYPES.expense &&
            refund.originalTransaction.accountId === account.id,
        ),
      ).toBe(true);
    });

    // it('successfully applies pagination', async () => {
    //   const account = await helpers.createAccount({ raw: true });
    //   // Create multiple refund transactions here...

    //   const response1 = await callGetRefundTransactions({ page: 1, limit: 1 }, true);
    //   const response2 = await callGetRefundTransactions({ page: 2, limit: 1 }, true);

    //   expect(response1.success).toBe(true);
    //   expect(response2.success).toBe(true);
    //   expect(response1.data.length).toBe(1);
    //   expect(response2.data.length).toBe(1);
    //   expect(response1.data[0].id).not.toBe(response2.data[0].id);
    //   expect(response1.meta.page).toBe(1);
    //   expect(response2.meta.page).toBe(2);
    // });
  });

  describe('failure cases', () => {
    it('fails when invalid categoryId is provided', async () => {
      const response = await callGetRefundTransactions({ categoryId: -10 });
      expect(response.statusCode).toBe(ERROR_CODES.BadRequest);
    });

    it('fails when invalid transactionType is provided', async () => {
      const response = await callGetRefundTransactions({
        transactionType: 'invalid' as TRANSACTION_TYPES,
      });
      expect(response.statusCode).toBe(ERROR_CODES.BadRequest);
    });

    it('fails when invalid accountId is provided', async () => {
      const response = await callGetRefundTransactions({ accountId: -10 });
      expect(response.statusCode).toBe(ERROR_CODES.BadRequest);
    });

    it('fails when invalid page number is provided', async () => {
      const response = await callGetRefundTransactions({ page: -10 });
      expect(response.statusCode).toBe(ERROR_CODES.BadRequest);
    });

    it('fails when invalid limit is provided', async () => {
      const response = await callGetRefundTransactions({ limit: -10 });
      expect(response.statusCode).toBe(ERROR_CODES.BadRequest);
    });
  });
});
