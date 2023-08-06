import { Op } from 'sequelize';
import { Model, Column, DataType, ForeignKey, BelongsTo, Table } from 'sequelize-typescript';
import { TRANSACTION_TYPES, BalanceModel, ACCOUNT_TYPES } from 'shared-types';
import { subDays } from 'date-fns';
import { GenericSequelizeModelAttributes } from '@common/types';
import Accounts from './Accounts.model';
import Transactions, { TransactionsAttributes } from './Transactions.model';

interface GetTotalBalanceHistoryPayload {
  startDate: Date;
  endDate: Date;
  accountIds: number[];
}

@Table({ timestamps: true })
export default class Balances extends Model<BalanceModel> {
  @Column({
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    allowNull: false,
    type: DataType.DATEONLY,
  })
  date: Date;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  amount: number;

  @ForeignKey(() => Accounts)
  @Column({ allowNull: false })
  accountId: number;

  @BelongsTo(() => Accounts)
  account: Accounts;

  // Method to calculate the total balance across all accounts
  static async getTotalBalance(
    { userId }: { userId: number },
    attributes: GenericSequelizeModelAttributes = {},
  ): Promise<number> {
    const userAccounts = await Accounts.findAll({ where: { userId: userId } });
    const accountIds = userAccounts.map(account => account.id);

    const result = await Balances.sum('amount', {
        where: { accountId: accountIds },
        transaction: attributes.transaction
    });

    return result || 0;
  }

  // Method to retrieve total balance history for specified dates and accounts
  static async getTotalBalanceHistory(
    payload: GetTotalBalanceHistoryPayload,
    attributes: GenericSequelizeModelAttributes = {},
  ): Promise<BalanceModel[]> {
    const { startDate, endDate, accountIds } = payload;
    return Balances.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
        accountId: accountIds,
      },
      order: [['date', 'ASC']],
      include: [Accounts],
      ...attributes,
    });
  }

  // Transactions might have positive and negative amount
  // ### Transaction creation
  // 1. ✅ If just a new tx is created. Create a new record with date and (amount + refAmount) of tx
  // 2. ✅ If new tx is created, but there's already record for that date, then just update the record's amount
  // 3. ✅ If new tx is created, but there's no record before that day, then create one
  //      more record to represent accounts' initialBalance and record for the transaction itself

  // ### Transaction updation
  // 1. ✅ If tx amount, data, accountId, or transactionType is updated, update balances correspondingly

  // ### Transaction deletion
  // 1. ✅ If tx is deleted, update balances for all records correspondingly

  // ### Account creation
  // 1. ✅ Add a new record to Balances table with a `currentBalance` that is specified in Accounts table

  // ### Account deletion will be handled by `cascade` deletion

  // ### Monobank account creation
  // 1. ✅ Add a new record to Balances table with a `currentBalance` that is specified in Accounts table

  // ### Monobank transaction creation
  // 1. Same as with system transaction creation

  // ### Monobank transaction deletion
  // 1. Remove record

  // ### Monobank account deletion, keep DB's cascade deletion

  static async handleTransactionChange(
    { data, prevData, isDelete = false }: { data: Transactions; prevData?: Transactions; isDelete?: boolean },
    attributes: GenericSequelizeModelAttributes = {},
  ) {
    const { accountId, time } = data;
    let amount = data.transactionType === TRANSACTION_TYPES.income ? data.amount : data.amount * -1
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);

    if (data.accountType === ACCOUNT_TYPES.system) {
      if (isDelete) {
        amount = -amount; // Reverse the amount if it's a deletion
      } else if (prevData) {
        const originalDate = new Date(prevData.time);
        const originalAmount = prevData.transactionType === TRANSACTION_TYPES.income
          ? prevData.amount
          : prevData.amount * -1
        originalDate.setHours(0, 0, 0, 0);

        // If the account ID changed, the date changed, the transaction type changed, or only the amount changed, remove the original transaction
        if (accountId !== prevData.accountId || +date !== +originalDate || data.transactionType !== prevData.transactionType || originalAmount !== amount) {
          await this.updateRecord({
            accountId: prevData.accountId,
            date: originalDate,
            amount: -originalAmount,
          }, attributes);
        }
      }

      // Update the balance for the current account and date
      await this.updateRecord({
        accountId,
        date,
        amount,
      }, attributes);
    } else if (data.accountType === ACCOUNT_TYPES.monobank) {
      const balance = (data.externalData as TransactionsAttributes['externalData']).balance;

      // We don't need to calculate Monobank account balance based on tx since
      // Monobank already provides us with the actual balance.
      const existingRecordForTheDate = await this.findOne({
        where: {
          accountId,
          date,
        },
        transaction: attributes.transaction,
      });

      if (existingRecordForTheDate) {
        // Store the highest amount
        existingRecordForTheDate.amount = existingRecordForTheDate.amount > balance
          ? existingRecordForTheDate.amount
          : balance;

        await existingRecordForTheDate.save();
      } else {
        await this.create({
          accountId,
          date,
          amount: (data.externalData as TransactionsAttributes['externalData']).balance,
        }, { transaction: attributes.transaction });
      }
    }
  }

  // Update the balance for a specific system account and date
  private static async updateRecord(
    { accountId, date, amount }: { accountId: number; date: Date; amount: number },
    attributes: GenericSequelizeModelAttributes = {}
  ) {
    // Try to find an existing balance for the account and date
    let balanceForTxDate = await this.findOne({
      where: {
        accountId,
        date,
      },
      transaction: attributes.transaction,
    });

    // If history record has previous amount, it means it's updating,
    // so we need to set newAmount - oldAmount
    if (!balanceForTxDate) {
      // If there's not balance for current tx data, we trying to find a balance
      // prior tx date
      const latestBalancePrior = await this.findOne({
        where: {
          date: {
            [Op.lt]: date,
          },
          accountId,
        },
        order: [['date', 'DESC']]
      })

      // If there's no balance prior tx date, it means that we're adding
      // the youngest transaction, aka the 1st one, so we need to check a balance
      // that comes prior it
      if (!latestBalancePrior) {
        // Example of how this logic should work like
        // Initially we had 100 at 10-10-23
        // Then we added 10 at 11-10-23, so 11-10-23 is now 100 + 10 = 110
        // Then we wanna add -10 at 9-10-23, so that we need to:
        // 1. Create a record for 8-10-23, with amount of 100 (so it will represent the initialBalance of account)
        // 2. Then create a record for 9-10-23 (our tx date), we correct amount
        // 3. Then update all future amounts
        const account = await Accounts.findOne({
          where: { id: accountId }
        })

        // (1) Firstly we now need to create one more record that will represent the
        // balance before that transaction
        await this.create({
          accountId,
          date: subDays(new Date(date), 1),
          amount: account.initialBalance,
        }, { transaction: attributes.transaction });

        // (2) Then we create a record for that transaction
        await this.create({
          accountId,
          date,
          amount: account.initialBalance + amount,
        }, { transaction: attributes.transaction });
      } else {
        // And then create a new record with the amount + latestBalance
        balanceForTxDate = await this.create({
          accountId,
          date,
          amount: latestBalancePrior.amount + amount,
        }, { transaction: attributes.transaction });
      }
    } else {
      // If a balance already exists, update its amount
      balanceForTxDate.amount += amount

      await balanceForTxDate.save();
    }

    // Update the amount of all balances for the account that come after the date
    await this.update(
      { amount: Balances.sequelize.literal(`amount + ${amount}`) },
      {
        where: {
          accountId,
          date: {
            [Op.gt]: date,
          },
        },
        transaction: attributes.transaction,
      },
    );
  }

  // Handle account creation
  static async handleAccountChange(
    { account, prevAccount }: { account: Accounts; prevAccount?: Accounts },
    attributes: GenericSequelizeModelAttributes = {},
  ) {
    const { id: accountId, initialBalance } = account;

    // Try to find an existing balance for the account
    const record = await this.findOne({
      where: {
        accountId,
      },
      transaction: attributes.transaction,
    });

    // If record exists, then it's account updating, otherwise account creation
    if (record && prevAccount) {
      const diff = initialBalance - prevAccount.initialBalance;

      // Update history for all the records realted to that account
      await this.update(
        { amount: Balances.sequelize.literal(`amount + ${diff}`) },
        {
          where: { accountId },
          transaction: attributes.transaction,
        },
      );
    } else {
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      // If no balance exists yet, create one with the account's current balance
      await this.create({
        accountId,
        date,
        amount: initialBalance,
      }, { transaction: attributes.transaction });
    }
  }
}

export interface DateQuery {
  // yyyy-mm-dd
  from?: string;
  // yyyy-mm-dd
  to?: string
}

const getWhereConditionForTime = ({ from, to }: DateQuery) => {
  const where: { date?: Record<symbol, Date[] | Date> } = {}

  if (from && to) {
    where.date = {
      [Op.between]: [new Date(from), new Date(to)],
    };
  } else if (from) {
    where.date = {
      [Op.gte]: new Date(from),
    };
  } else if (to) {
    where.date = {
      [Op.lte]: new Date(to),
    };
  }

  return where;
};

// Method to get all balances
export const getBalances = async (
  { userId, from, to }: { userId: number } & DateQuery,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<BalanceModel[]> => {
  return Balances.findAll({
    where: getWhereConditionForTime({ from, to }),
    order: [['date', 'ASC']],
    include: [{
      model: Accounts,
      where: { userId },
      attributes: [],
    }],
    attributes: ['date', 'amount', 'accountId'],
    ...attributes,
  });
}

// Method to get the balance for a specific account
export const getAccountBalanceHistory = async (
  { accountId, userId, from, to }: { accountId: number; userId: number; } & DateQuery,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<Balances[]> => {
  return Balances.findAll({
    where: getWhereConditionForTime({ from, to }),
    order: [['date', 'ASC']],
    include: [{
      model: Accounts,
      where: { userId, id: accountId },
      attributes: [],
    }],
    attributes: ['date', 'amount'],
    ...attributes,
  });
}
