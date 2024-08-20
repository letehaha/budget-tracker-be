import { TRANSACTION_TYPES } from 'shared-types';
import * as helpers from '@tests/helpers';
import { ERROR_CODES } from '@js/errors';

const callCreateSingleRefund = async (
  payload: { originalTxId: number | null; refundTxId: number },
  raw = false,
) => {
  const result = await helpers.makeRequest({
    method: 'post',
    url: '/transactions/refund',
    payload,
  });

  return raw ? helpers.extractResponse(result) : result;
};

const callDeleteRefund = async (
  payload: { originalTxId: number | null; refundTxId: number },
  raw = false,
) => {
  const result = await helpers.makeRequest({
    method: 'delete',
    url: '/transactions/refund',
    payload,
  });

  return raw ? helpers.extractResponse(result) : result;
};

const callGetRefund = async (
  { originalTxId, refundTxId }: { originalTxId: number; refundTxId: number },
  raw = false,
) => {
  const result = await helpers.makeRequest({
    method: 'get',
    url: `/transactions/refund?originalTxId=${originalTxId}&refundTxId=${refundTxId}`,
  });

  return raw ? helpers.extractResponse(result) : result;
};

describe('removeRefundLink', () => {
  describe('success cases', () => {
    it('successfully removes a refund link between two transactions', async () => {
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

      const creationResponse = await callCreateSingleRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      expect(creationResponse.statusCode).toBe(200);

      const deletionResponse = await callDeleteRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      expect(deletionResponse.statusCode).toBe(200);

      const getResponse = await callGetRefund({
        originalTxId: originalTx.id,
        refundTxId: refundTx.id,
      });

      expect(getResponse.statusCode).toBe(404);

      const transactions = await helpers.getTransactions({ raw: true });

      // Check that after refund deletion all transactions are in place
      expect(
        [originalTx.id, refundTx.id].every((id) => transactions.find((tx) => tx.id === id)),
      ).toBe(true);
    });
  });

  describe('failure cases', () => {
    it('fails when refund link does not exist', async () => {
      const response = await callDeleteRefund({
        originalTxId: 999999,
        refundTxId: 999998,
      });

      expect(response.statusCode).toBe(ERROR_CODES.NotFoundError);
    });

    it('fails when one of the transactions does not exist', async () => {
      const account = await helpers.createAccount({ raw: true });

      const [baseTx] = await helpers.createTransaction({
        payload: helpers.buildTransactionPayload({
          accountId: account.id,
          amount: 100,
          transactionType: TRANSACTION_TYPES.expense,
        }),
        raw: true,
      });

      let response = await callDeleteRefund({
        originalTxId: baseTx.id,
        refundTxId: 999998,
      });

      expect(response.statusCode).toBe(ERROR_CODES.NotFoundError);

      response = await callDeleteRefund({
        originalTxId: 999998,
        refundTxId: baseTx.id,
      });

      expect(response.statusCode).toBe(ERROR_CODES.NotFoundError);
    });

    it('fails when no required params provided', async () => {
      const response = await helpers.makeRequest({
        method: 'delete',
        url: '/transactions/refund',
      });

      expect(response.statusCode).toBe(ERROR_CODES.BadRequest);
    });
  });

  describe('removeRefundLink with optional original_tx_id', () => {
    describe('success cases', () => {
      it('successfully removes a refund link with null original_tx_id', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [refundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const creationResponse = await callCreateSingleRefund({
          originalTxId: null,
          refundTxId: refundTx.id,
        });

        expect(creationResponse.statusCode).toBe(200);

        const deletionResponse = await callDeleteRefund({
          originalTxId: null,
          refundTxId: refundTx.id,
        });

        expect(deletionResponse.statusCode).toBe(200);

        const getResponse = await callGetRefund({
          originalTxId: null,
          refundTxId: refundTx.id,
        });

        expect(getResponse.statusCode).toBe(404);

        const transactions = await helpers.getTransactions({ raw: true });

        // Check that after refund deletion the refund transaction is still in place
        expect(transactions.some((tx) => tx.id === refundTx.id)).toBe(true);
      });
    });

    describe('failure cases', () => {
      it('fails when trying to remove a non-existent refund link with null original_tx_id', async () => {
        const response = await callDeleteRefund({
          originalTxId: null,
          refundTxId: 999998,
        });

        expect(response.statusCode).toBe(ERROR_CODES.NotFoundError);
      });

      it('fails when trying to remove a refund link with null original_tx_id that was created with a non-null original_tx_id', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [originalTx, refundTx] = await Promise.all([
          helpers.createTransaction({
            payload: helpers.buildTransactionPayload({
              accountId: account.id,
              amount: 100,
              transactionType: TRANSACTION_TYPES.expense,
            }),
            raw: true,
          }),
          helpers.createTransaction({
            payload: helpers.buildTransactionPayload({
              accountId: account.id,
              amount: 100,
              transactionType: TRANSACTION_TYPES.income,
            }),
            raw: true,
          }),
        ]);

        await callCreateSingleRefund({
          originalTxId: originalTx[0].id,
          refundTxId: refundTx[0].id,
        });

        const response = await callDeleteRefund({
          originalTxId: null,
          refundTxId: refundTx[0].id,
        });

        expect(response.statusCode).toBe(ERROR_CODES.NotFoundError);
      });
    });
  });
});
