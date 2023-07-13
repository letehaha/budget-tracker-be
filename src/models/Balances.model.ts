import { Op } from 'sequelize';
import { Model, Column, DataType, ForeignKey, BelongsTo, Table } from 'sequelize-typescript';
import { GenericSequelizeModelAttributes } from '@common/types';
import Accounts from './Accounts.model';
import Transactions from './Transactions.model';

interface BalanceAttributes {
  id: number;
  date: Date;
  amount: number;
  accountId: number;
}

interface GetTotalBalanceHistoryPayload {
  startDate: Date;
  endDate: Date;
  accountIds: number[];
}

@Table({ timestamps: true })
export default class Balances extends Model<BalanceAttributes> {
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
    attributes: GenericSequelizeModelAttributes = {},
  ): Promise<number> {
    const result = await Balances.sum('amount', attributes);
    return result || 0;
  }

  // Method to get all balances
  static async getBalances(
    attributes: GenericSequelizeModelAttributes = {},
  ): Promise<BalanceAttributes[]> {
    return Balances.findAll({
      include: [Accounts],
      ...attributes,
    });
  }

  // Method to get the balance for a specific account
  static async getBalanceByAccountId(
    { accountId}: { accountId: number },
    attributes: GenericSequelizeModelAttributes = {},
  ): Promise<number> {
    const result = await Balances.sum('amount', {
      where: {
        accountId,
      },
      ...attributes,
    });
    return result || 0;
  }

  // Method to retrieve total balance history for specified dates and accounts
  static async getTotalBalanceHistory(
    payload: GetTotalBalanceHistoryPayload,
    attributes: GenericSequelizeModelAttributes = {},
  ): Promise<BalanceAttributes[]> {
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
  // 1. If just a new tx is created. Create a new record with date and (amount + refAmount) of tx
  // 2. If new tx is created, but there's already record for that date, then just update the record's amount

  // ### Transaction updation
  // 1. If tx amount is updated, update amount of current record and all the future ones
  // 2. If tx date is updated, update balances correspondingly
  // 3. If tx date and amount are updated, update balances correspondingly
  // 4. If tx account is changed, update balances for all records that are associated with that accounts correspondingly

  // ### Transaction deletion
  // 1. If tx is deleted, update balances for all records correspondingly

  // ### Account creation
  // 1. Add a new record to Balances table with a `currentBalance` that is specified in Accounts table

  // ### Account deletion will be handled by `cascade` deletion

  static async handleTransactionChange(
    { data, prevData, isDelete = false }: { data: Transactions; prevData?: Transactions; isDelete?: boolean },
    attributes: GenericSequelizeModelAttributes = {},
  ) {
    const { accountId, time } = data;
    let { amount } = data;
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);

    if (isDelete) {
      amount = -amount; // Reverse the amount if it's a deletion
    } else if (prevData) {
      const originalDate = new Date(prevData.time);
      originalDate.setHours(0, 0, 0, 0);

      if (data.accountId !== prevData.accountId || originalDate.getTime() !== date.getTime()) {
        // If the account ID or date changed, subtract the original amount from the old account and/or date
        await this.updateBalance({
          accountId: prevData.accountId,
          date: originalDate,
          amount: -prevData.amount,
        }, attributes);
      }
    }

    // Update the balance for the current account and date
    await this.updateBalance({
      accountId,
      date,
      amount,
      prevAmount: prevData?.amount,
    }, attributes);
  }

  // Update the balance for a specific account and date
  private static async updateBalance(
    { accountId, date, amount, prevAmount }: { accountId: number; date: Date; amount: number; prevAmount?: number },
    attributes: GenericSequelizeModelAttributes = {}
  ) {
    // Try to find an existing balance for the account and date
    let balance = await this.findOne({
      where: {
        accountId,
        date,
      },
      transaction: attributes.transaction,
    });

    // If trasnaction has previous amount, it means it's updating,
    // so we need to set newAmount - oldAmount
    const newAmount = prevAmount ? amount - prevAmount : amount

    if (!balance) {
      // If no balance exists yet, get the latest balance
      const latestBalance = await this.findOne({
        where: {
          date: {
            [Op.lt]: date,
          },
          accountId,
        },
        order: [['date', 'DESC']]
      })

      // And then create a new record with the amount + latestBalance
      balance = await this.create({
        accountId,
        date,
        amount: latestBalance.amount + amount,
      }, { transaction: attributes.transaction });
    } else {
      // If a balance already exists, update its amount

      balance.amount += newAmount

      await balance.save();
    }

    // Update the amount of all balances for the account that come after the date
    await this.update(
      { amount: Balances.sequelize.literal(`amount + ${newAmount}`) },
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
  static async handleAccountCreation(account: Accounts, attributes: GenericSequelizeModelAttributes = {}) {
    const { id: accountId, currentBalance } = account;

    // Try to find an existing balance for the account
    const balance = await this.findOne({
      where: {
        accountId,
      },
      transaction: attributes.transaction,
    });

    // If we already have a balance for that account, it's super weird but do nothgint
    if (balance) return

    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // If no balance exists yet, create one with the account's current balance
    await this.create({
      accountId,
      date,
      amount: currentBalance,
    }, { transaction: attributes.transaction });
  }
}
