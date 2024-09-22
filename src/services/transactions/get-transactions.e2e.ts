import { TRANSACTION_TYPES, TRANSACTION_TRANSFER_NATURE, SORT_DIRECTIONS } from 'shared-types';
import { subDays, compareAsc, compareDesc } from 'date-fns';
import * as helpers from '@tests/helpers';
import { ERROR_CODES } from '@js/errors';

const dates = {
  income: '2024-08-02T00:00:00Z',
  expense: '2024-08-03T00:00:00Z',
  transfer: '2024-09-03T00:00:00Z',
  refunds: '2024-07-03T00:00:00Z',
};

describe('Retrieve transactions with filters', () => {
  const createMockTransactions = async () => {
    const accountA = await helpers.createAccount({ raw: true });
    const {
      currencies: [currencyB],
    } = await helpers.addUserCurrencies({ currencyCodes: ['UAH'], raw: true });
    const accountB = await helpers.createAccount({
      payload: {
        ...helpers.buildAccountPayload(),
        currencyId: currencyB!.id,
      },
      raw: true,
    });

    const [income] = await helpers.createTransaction({
      payload: helpers.buildTransactionPayload({
        accountId: accountA.id,
        amount: 2000,
        transactionType: TRANSACTION_TYPES.income,
        time: dates.income,
      }),
      raw: true,
    });
    const [expense] = await helpers.createTransaction({
      payload: helpers.buildTransactionPayload({
        accountId: accountB.id,
        amount: 2000,
        transactionType: TRANSACTION_TYPES.expense,
        time: dates.expense,
      }),
      raw: true,
    });
    const [transferIncome, transferExpense] = await helpers.createTransaction({
      payload: {
        ...helpers.buildTransactionPayload({ accountId: accountA.id, amount: 5000 }),
        transferNature: TRANSACTION_TRANSFER_NATURE.common_transfer,
        destinationAmount: 10000,
        destinationAccountId: accountB.id,
        time: dates.transfer,
      },
      raw: true,
    });

    const [refundOriginal] = await helpers.createTransaction({
      payload: helpers.buildTransactionPayload({
        accountId: accountA.id,
        amount: 1000,
        transactionType: TRANSACTION_TYPES.income,
        time: dates.refunds,
      }),
      raw: true,
    });
    const refundTxPayload = {
      ...helpers.buildTransactionPayload({
        accountId: accountA.id,
        amount: 1000,
        transactionType: TRANSACTION_TYPES.expense,
        time: dates.refunds,
      }),
      refundsTxId: refundOriginal.id,
    };
    const [refundTx] = await helpers.createTransaction({
      payload: refundTxPayload,
      raw: true,
    });

    return { income, expense, transferIncome, transferExpense, refundOriginal, refundTx };
  };

  describe('filtered by dates', () => {
    it('[success] for `startDate`', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        startDate: dates.income,
        raw: true,
      });

      expect(res.length).toBe(4); // income, expense, two transfers
    });
    it('[success] for `endDate`', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        endDate: dates.income,
        raw: true,
      });

      expect(res.length).toBe(3); // income, two refunds
    });
    it('[success] for date range', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        startDate: dates.income,
        endDate: dates.expense,
        raw: true,
      });

      expect(res.length).toBe(2); // income, expense
    });
    it('[success] for date range with the same value', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        startDate: dates.income,
        endDate: dates.income,
        raw: true,
      });

      expect(res.length).toBe(1); // income
    });
    it('[success] when `startDate` bigger than `endDate`', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        startDate: new Date().toISOString(),
        endDate: subDays(new Date(), 1).toISOString(),
        raw: true,
      });

      expect(res.length).toBe(0);
    });
  });

  it('should retrieve transactions filtered by transactionType', async () => {
    await createMockTransactions();

    const res = await helpers.getTransactions({
      transactionType: TRANSACTION_TYPES.expense,
      raw: true,
    });

    expect(res.length).toBe(3); // expense, 1 of transfers, 1 of refunds
    expect(res.every((t) => t.transactionType === TRANSACTION_TYPES.expense)).toBe(true);
  });

  it('should retrieve transactions excluding transfers', async () => {
    await createMockTransactions();

    const res = await helpers.getTransactions({
      excludeTransfer: true,
      raw: true,
    });

    expect(res.length).toBe(4); // income, expense, refunds
    expect(res.every((t) => t.transferNature === TRANSACTION_TRANSFER_NATURE.not_transfer)).toBe(
      true,
    );
  });

  it('should retrieve transactions excluding refunds', async () => {
    await createMockTransactions();

    const res = await helpers.getTransactions({
      excludeRefunds: true,
      raw: true,
    });

    expect(res.length).toBe(4);
    expect(res.every((t) => t.refundLinked === false)).toBe(true);
  });

  it.each([
    [SORT_DIRECTIONS.desc, compareDesc],
    [SORT_DIRECTIONS.asc, compareAsc],
  ])('should retrieve transactions sorted by time `%s`', async (direction, comparer) => {
    const transactions = Object.values(await createMockTransactions());

    const res = await helpers.getTransactions({
      order: direction,
      raw: true,
    });

    expect(res.length).toBe(6);
    expect(
      transactions.map((t) => t!.time).sort((a, b) => comparer(new Date(a), new Date(b))),
    ).toEqual(res.map((t) => t.time));
  });

  it('should retrieve transactions filtered by accountIds', async () => {
    const { expense } = await createMockTransactions();

    const res = await helpers.getTransactions({
      accountIds: [expense.accountId],
      raw: true,
    });

    expect(res.length).toBe(2); // expense, 1 of transfers
    expect(res.every((t) => t.accountId === expense.accountId)).toBe(true);
  });

  describe('filter by amount', () => {
    it('`amountLte`', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        amountLte: 1000,
        raw: true,
      });

      expect(res.length).toBe(2); // refunds
      res.forEach((tx) => {
        expect(tx.amount).toBeGreaterThanOrEqual(1000);
      });
    });
    it('`amountGte`', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        amountGte: 5000,
        raw: true,
      });

      expect(res.length).toBe(2); // transfers
      res.forEach((tx) => {
        expect(tx.amount).toBeGreaterThanOrEqual(5000);
      });
    });
    it('both `amountLte` and `amountGte`', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        amountGte: 2000,
        amountLte: 5000,
        raw: true,
      });

      expect(res.length).toBe(3); // income, expense, 1 of transfers
      res.forEach((tx) => {
        expect(tx.amount >= 2000 && tx.amount <= 5000).toBe(true);
      });
    });

    it('fails when `amountLte` bigger than `amountGte`', async () => {
      await createMockTransactions();

      const res = await helpers.getTransactions({
        amountLte: 2000,
        amountGte: 5000,
      });

      expect(res.statusCode).toBe(ERROR_CODES.ValidationError);
    });
  });
});
