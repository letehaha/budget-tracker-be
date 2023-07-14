/* eslint-disable @typescript-eslint/no-explicit-any */
import Balances from './Balances.model';
import { GenericSequelizeModelAttributes } from '@common/types';
import { serverInstance, redisClient } from '@root/app';
import Transactions from './Transactions.model';

describe('Balances model', () => {
  afterAll(() => {
    redisClient.quit();
    serverInstance.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('handleTransactionChange', () => {
    const mockTransaction: Partial<Transactions> = {
      accountId: 1,
      time: new Date(),
      amount: 500,
    };

    const mockAttributes: GenericSequelizeModelAttributes = {};
    let mockUpdateBalance

    beforeEach(() => {
      mockUpdateBalance = jest.spyOn(Balances as any, 'updateBalance');
      mockUpdateBalance.mockResolvedValue(true);
    })

    it('handles transaction deletion correctly', async () => {
      await Balances.handleTransactionChange({
        data: mockTransaction as Transactions,
        isDelete: true,
      }, mockAttributes);

      expect(mockUpdateBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateBalance).toBeCalledWith({
        amount: mockTransaction.amount * -1,
        date: expect.anything(),
        accountId: 1,
      }, mockAttributes)
    });

    it('handles transaction addition correctly', async () => {
      await Balances.handleTransactionChange({
        data: mockTransaction as Transactions
      }, mockAttributes);

      expect(mockUpdateBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateBalance).toBeCalledWith({
        amount: mockTransaction.amount,
        date: expect.anything(),
        accountId: 1,
      }, mockAttributes)
    });

    it('handles transaction change correctly', async () => {
      await Balances.handleTransactionChange({
        data: mockTransaction as Transactions,
      }, mockAttributes);

      expect(mockUpdateBalance).toHaveBeenCalledTimes(1);
      expect(mockUpdateBalance).toBeCalledWith({
        amount: mockTransaction.amount,
        date: expect.anything(),
        accountId: 1,
      }, mockAttributes)
    });

    it("handles transaction's accountId change correctly", async () => {
      const mockPrevTransactionData: Partial<Transactions> = {
        accountId: 2,
        time: new Date(),
        amount: 600,
      };

      await Balances.handleTransactionChange({
        data: mockTransaction as any,
        prevData: mockPrevTransactionData as any,
      }, mockAttributes);

      expect(mockUpdateBalance).toHaveBeenCalledTimes(2);
      expect(mockUpdateBalance).toHaveBeenNthCalledWith(1, {
        amount: mockPrevTransactionData.amount * -1,
        date: expect.anything(),
        accountId: 2,
      }, mockAttributes)
      expect(mockUpdateBalance).toHaveBeenNthCalledWith(2, {
        amount: mockTransaction.amount,
        prevAmount: mockPrevTransactionData.amount,
        date: expect.anything(),
        accountId: 1,
      }, mockAttributes)
    });
  });

  describe('updateBalance', () => {
    const currentDate = new Date()
    const priorDate = new Date(currentDate)
    priorDate.setDate(currentDate.getDate() - 1)

    const initialCurrentBalanceAmount = 1000
    const transactionData: Partial<Transactions> = {
      accountId: 1,
      time: currentDate,
      amount: 1000,
    }

    const prevBalanceData = {
      amount: 500,
      accountId: transactionData.accountId,
      date: priorDate,
    };

    const mockAttributes: GenericSequelizeModelAttributes = {};
    let currentBalanceData, findOneSpy, createSpy, updateSpy, originalSequelize

    beforeEach(() => {
      originalSequelize = Balances.sequelize

      findOneSpy = jest.spyOn(Balances, 'findOne');

      createSpy = jest.spyOn(Balances, 'create');
      createSpy.mockResolvedValueOnce({});

      currentBalanceData = {
        accountId: transactionData.accountId,
        date: currentDate,
        amount: initialCurrentBalanceAmount,
        save: jest.fn().mockImplementation(function() {
          return Promise.resolve(true);
        }),
      }

      updateSpy = jest.spyOn(Balances, 'update');
      updateSpy.mockResolvedValueOnce([1]); // indicate one row updated

      (Balances as any).sequelize = { literal: jest.fn((value) => value) };
    });

    afterEach(() => {
      (Balances as any).sequelize = originalSequelize;
    });

    it('updates balance correctly for transaction WITH NO record for that date', async () => {
      // `null` means that we didn't find record for that date, so for the next
      // call we will return
      findOneSpy.mockResolvedValueOnce(null).mockResolvedValueOnce(prevBalanceData);

      await Balances.handleTransactionChange({ data: transactionData as Transactions }, mockAttributes);

      expect(findOneSpy).toHaveBeenCalledTimes(2);
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledWith({
        amount: transactionData.amount + prevBalanceData.amount,
        accountId: transactionData.accountId,
        date: expect.anything()
      }, mockAttributes);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledWith({
        // So we're checking that literal was called with a correct column and value
        amount: `amount + ${transactionData.amount}`,
      }, expect.anything());
    });

    describe('updates balance correctly for transaction WITH record for that date', () => {
      it('new transaction', async () => {
        findOneSpy.mockResolvedValueOnce(currentBalanceData);

        await Balances.handleTransactionChange({ data: transactionData as Transactions }, mockAttributes);

        expect(findOneSpy).toHaveBeenCalledTimes(1);
        expect(createSpy).toHaveBeenCalledTimes(0);
        expect(currentBalanceData.save).toHaveBeenCalledTimes(1);
        expect(currentBalanceData.amount).toBe(initialCurrentBalanceAmount + transactionData.amount)
        expect(updateSpy).toHaveBeenCalledTimes(1);
        expect(updateSpy).toHaveBeenCalledWith({
          // So we're checking that literal was called with a correct column and value
          amount: `amount + ${transactionData.amount}`,
        }, expect.anything());
      });

      describe('already existing transaction', () => {
        it('only amount changed ', async () => {
          findOneSpy.mockResolvedValueOnce(currentBalanceData);
          const prevTransactionData = {
            ...transactionData,
            amount: 100,
          }

          await Balances.handleTransactionChange({
            data: transactionData as Transactions,
            prevData: prevTransactionData as Transactions,
          }, mockAttributes);

          expect(findOneSpy).toHaveBeenCalledTimes(1);
          expect(createSpy).toHaveBeenCalledTimes(0);
          expect(currentBalanceData.save).toHaveBeenCalledTimes(1);
          expect(currentBalanceData.amount).toBe(initialCurrentBalanceAmount + transactionData.amount - prevTransactionData.amount)
          expect(updateSpy).toHaveBeenCalledTimes(1);
          expect(updateSpy).toHaveBeenCalledWith({
            // So we're checking that literal was called with a correct column and value
            amount: `amount + ${transactionData.amount - prevTransactionData.amount}`,
          }, expect.anything());
        });
      })
    })
  });
});
