import { TRANSACTION_TRANSFER_NATURE, TRANSACTION_TYPES } from 'shared-types';
import * as helpers from '@tests/helpers';
import { ERROR_CODES } from '@js/errors';

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

const callDeleteRefund = async (
  payload: { originalTxId: number; refundTxId: number },
  raw = false,
) => {
  const result = await helpers.makeRequest({
    method: 'delete',
    url: '/transactions/refund',
    payload,
  });

  return raw ? helpers.extractResponse(result) : result;
};

describe('Refund Transactions service', () => {
  describe('createSingleRefund', () => {
    describe('success cases', () => {
      it('successfully creates a refund link between two transactions', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [baseTx] = await helpers.createTransaction({
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

        const result = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx.id,
          },
          true,
        );

        expect(result.original_tx_id).toEqual(baseTx.id);
        expect(result.refund_tx_id).toEqual(refundTx.id);
      });

      it(`successfully creates a refund link between two transactions with different currencies when:
          – refund amount LESS than base tx amount
          - refund refAmount LESS than base tx amount
      `, async () => {
        const account = await helpers.createAccount({ raw: true });
        const currencyB = global.MODELS_CURRENCIES.find((item) => item.code === 'UAH');
        const accountB = await helpers.createAccount({
          payload: {
            ...helpers.buildAccountPayload(),
            currencyId: currencyB.id,
          },
          raw: true,
        });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        const [refundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountB.id,
            amount: 90,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx.id,
          },
          true,
        );

        expect(baseTx.currencyId !== refundTx.currencyId).toBe(true);
        expect(baseTx.amount > refundTx.amount).toBe(true);
        expect(baseTx.refAmount > refundTx.refAmount).toBe(true);
        expect(result.original_tx_id).toEqual(baseTx.id);
        expect(result.refund_tx_id).toEqual(refundTx.id);
      });

      it(`successfully creates a refund link between two transactions with different currencies when:
          – refund amount BIGGER than base tx amount
          - refund refAmount LESS than base tx amount
      `, async () => {
        const account = await helpers.createAccount({ raw: true });
        const currencyB = global.MODELS_CURRENCIES.find((item) => item.code === 'UAH');
        const accountB = await helpers.createAccount({
          payload: {
            ...helpers.buildAccountPayload(),
            currencyId: currencyB.id,
          },
          raw: true,
        });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        const [refundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountB.id,
            amount: 200,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx.id,
          },
          true,
        );

        expect(baseTx.currencyId !== refundTx.currencyId).toBe(true);
        expect(refundTx.amount > baseTx.amount).toBe(true);
        expect(baseTx.refAmount > refundTx.refAmount).toBe(true);
        expect(result.original_tx_id).toEqual(baseTx.id);
        expect(result.refund_tx_id).toEqual(refundTx.id);
      });

      it('works correctly for cross-account refunds', async () => {
        const account1 = await helpers.createAccount({ raw: true });
        const account2 = await helpers.createAccount({
          payload: helpers.buildAccountPayload({ userId: account1.userId }),
          raw: true,
        });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account1.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        const [refundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account2.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx.id,
          },
          true,
        );

        expect(baseTx.accountId !== refundTx.accountId).toBe(true);
        expect(result.original_tx_id).toEqual(baseTx.id);
        expect(result.refund_tx_id).toEqual(refundTx.id);
      });

      it('successfully creates multiple partial refunds', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        // First partial refund
        const [refundTx1] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 40,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result1 = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx1.id,
          },
          true,
        );

        expect(result1.original_tx_id).toEqual(baseTx.id);
        expect(result1.refund_tx_id).toEqual(refundTx1.id);

        // Second partial refund
        const [refundTx2] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 60,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result2 = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx2.id,
          },
          true,
        );

        expect(result2.original_tx_id).toEqual(baseTx.id);
        expect(result2.refund_tx_id).toEqual(refundTx2.id);
      });

      it('successfully creates multiple partial refunds with different currencies', async () => {
        const account = await helpers.createAccount({ raw: true });
        const currencyB = global.MODELS_CURRENCIES.find((item) => item.code === 'UAH');
        const accountB = await helpers.createAccount({
          payload: {
            ...helpers.buildAccountPayload(),
            currencyId: currencyB.id,
          },
          raw: true,
        });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        // First partial refund
        const [refundTx1] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 40,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx1.id,
        });

        // Second partial refund with different currency
        const [refundTx2] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountB.id,
            amount: 1000,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx2.id,
          },
          true,
        );

        expect(result.original_tx_id).toEqual(baseTx.id);
        expect(result.refund_tx_id).toEqual(refundTx2.id);
      });

      it('successfully creates refund tx after unlinking', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [baseTx] = await helpers.createTransaction({
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

        let creationResponse = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx.id,
          },
          true,
        );

        expect(creationResponse.original_tx_id).toEqual(baseTx.id);
        expect(creationResponse.refund_tx_id).toEqual(refundTx.id);

        const unlinkResponse = await callDeleteRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx.id,
        });

        expect(unlinkResponse.statusCode).toBe(200);

        creationResponse = await callCreateSingleRefund(
          {
            originalTxId: baseTx.id,
            refundTxId: refundTx.id,
          },
          true,
        );

        expect(creationResponse.original_tx_id).toEqual(baseTx.id);
        expect(creationResponse.refund_tx_id).toEqual(refundTx.id);
      });
    });

    describe('failure cases', () => {
      it(`failes to create a refund link between two transactions with different currencies when:
          - base amount BIGGER than refund amount
          - base refAmount LESS than refund refAmount
      `, async () => {
        const account = await helpers.createAccount({ raw: true });
        const accountB = await helpers.createAccount({
          payload: {
            ...helpers.buildAccountPayload(),
            // By default base currency is USD, so we need currency that has bigger exchange rate
            currencyId: global.MODELS_CURRENCIES.find((item) => item.code === 'EUR').id,
          },
          raw: true,
        });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        const [refundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountB.id,
            amount: 98,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx.id,
        });

        expect(baseTx.amount > refundTx.amount).toBe(true);
        expect(baseTx.refAmount < refundTx.refAmount).toBe(true);
        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain('cannot be greater');
      });

      it('fails when trying to refund with the same transaction type', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [baseTx] = await helpers.createTransaction({
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
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx.id,
        });

        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain('opposite transaction type');
      });

      it('fails when refund amount is greater than original amount', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [baseTx] = await helpers.createTransaction({
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
            amount: 150,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx.id,
        });

        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain('cannot be greater than');
      });

      it('fails when total refund amount exceeds original transaction amount', async () => {
        const account = await helpers.createAccount({ raw: true });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        // First partial refund
        const [refundTx1] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 60,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx1.id,
        });

        // Second partial refund (which would exceed the original amount)
        const [refundTx2] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 50,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx2.id,
        });

        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain('cannot be greater than');
      });

      it('fails when total refund amount exceeds original transaction amount with different currencies', async () => {
        const account = await helpers.createAccount({ raw: true });
        const currencyB = global.MODELS_CURRENCIES.find((item) => item.code === 'UAH');
        const accountB = await helpers.createAccount({
          payload: {
            ...helpers.buildAccountPayload(),
            currencyId: currencyB.id,
          },
          raw: true,
        });

        const [baseTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        // First partial refund
        const [refundTx1] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 600,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx1.id,
        });

        // Second partial refund with different currency (which would exceed the original amount)
        const [refundTx2] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: accountB.id,
            amount: 10000,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: refundTx2.id,
        });

        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain('cannot be greater than');
      });

      it('fails when trying to refund a transfer transaction', async () => {
        const account1 = await helpers.createAccount({ raw: true });
        const account2 = await helpers.createAccount({
          payload: helpers.buildAccountPayload({ userId: account1.userId }),
          raw: true,
        });

        // Create a transfer transaction
        const [baseTransferTx] = await helpers.createTransaction({
          payload: {
            ...helpers.buildTransactionPayload({
              accountId: account1.id,
              amount: 10,
              transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
              destinationAmount: 10,
              destinationAccountId: account2.id,
            }),
          },
          raw: true,
        });

        // Attempt to create a refund for the transfer
        const [refundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account2.id,
            amount: 10,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: baseTransferTx.id,
          refundTxId: refundTx.id,
        });

        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain('transaction cannot be transfer');
      });

      it('fails when trying to refund a refund transaction', async () => {
        const account = await helpers.createAccount({ raw: true });

        // Create an original transaction
        const [originalTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        // Create a refund transaction
        const [refundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.income,
          }),
          raw: true,
        });

        // Link the refund to the original transaction
        await callCreateSingleRefund({
          originalTxId: originalTx.id,
          refundTxId: refundTx.id,
        });

        // Attempt to refund the refund transaction
        const [refundOfRefundTx] = await helpers.createTransaction({
          payload: helpers.buildTransactionPayload({
            accountId: account.id,
            amount: 100,
            transactionType: TRANSACTION_TYPES.expense,
          }),
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: refundTx.id,
          refundTxId: refundOfRefundTx.id,
        });

        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain(
          'Cannot refund a "refund" transaction',
        );
      });

      it('fails when trying to link transcation to itself', async () => {
        const account1 = await helpers.createAccount({ raw: true });

        const [baseTx] = await helpers.createTransaction({
          payload: {
            ...helpers.buildTransactionPayload({
              accountId: account1.id,
              amount: 10,
              transactionType: TRANSACTION_TYPES.expense,
            }),
          },
          raw: true,
        });

        const result = await callCreateSingleRefund({
          originalTxId: baseTx.id,
          refundTxId: baseTx.id,
        });

        expect(result.statusCode).toEqual(ERROR_CODES.ValidationError);
        expect(helpers.extractResponse(result).message).toContain(
          'Attempt to link a single transaction to itself',
        );
      });
    });
  });
});
