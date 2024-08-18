import { TRANSACTION_TYPES } from 'shared-types';
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
    });
  });
});
