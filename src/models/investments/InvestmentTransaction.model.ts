import {
  TRANSACTION_TRANSFER_NATURE,
  TRANSACTION_TYPES,
  INVESTMENT_TRANSACTION_CATEGORY,
  InvestmentTransactionModel,
} from 'shared-types';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';
import Account from '@models/Accounts.model';
import Security from '@models/investments/Security.model';

@Table({
  timestamps: true,
  tableName: 'InvestmentTransactions',
})
export default class InvestmentTransaction extends Model<InvestmentTransactionModel> {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  /**
   * The identifier of the account associated with this transaction.
   * It links the transaction to a specific investment account.
   */
  @ForeignKey(() => Account)
  @Column
  accountId: number;

  @ForeignKey(() => Security)
  @Column({ allowNull: true })
  securityId: number;

  @Column({ allowNull: false, defaultValue: TRANSACTION_TYPES.income })
  transactionType: TRANSACTION_TYPES;

  @Column({ type: DataType.DATE })
  date: string;

  /**
   * A descriptive name or title for the investment transaction, providing a
   * quick overview of the transaction's nature. Same as `note` in `Transactions`
   */
  @Column({ type: DataType.STRING, allowNull: true })
  name: string;

  /**
   * The monetary value involved in the transaction. Depending on the context,
   * this could represent the cost, sale proceeds, or other financial values
   * associated with the transaction. Basically quantity * price
   */
  @Column({ type: DataType.DECIMAL(20, 10) })
  amount: string;
  @Column({ type: DataType.DECIMAL(20, 10) })
  refAmount: string;

  @Column({ type: DataType.DECIMAL(20, 10), allowNull: true })
  fees: string;
  @Column({ type: DataType.DECIMAL(20, 10), allowNull: true })
  refFees: string;

  /**
   * * The quantity of the security involved in the transaction. This is crucial
   * for tracking the changes in holdings as a result of the transaction.
   */
  @Column({ type: DataType.DECIMAL(36, 18) })
  quantity: string;

  /**
   * The price per unit of the security at the time of the transaction.
   * This is used to calculate the total transaction amount and update the cost
   * basis of the holding. TODO: why null is allowed?
   */
  @Column({ type: DataType.DECIMAL(20, 10), allowNull: true })
  price: string;
  @Column({ type: DataType.DECIMAL(20, 10), allowNull: true })
  refPrice: string;

  /**
   * The ISO currency code or standard cryptocurrency code representing the currency
   * in which the transaction was conducted. For cryptocurrencies, this code refers to
   * the specific cryptocurrency involved (e.g., BTC for Bitcoin, ETH for Ethereum).
   */
  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  currencyCode: string;

  /**
   * A category that classifies the nature of the investment transaction.
   * This could include types like 'buy', 'sell', 'dividend', 'interest', etc.,
   * providing a clear context for the transaction's purpose and impact on the investment portfolio.
   */
  @Column({
    type: DataType.ENUM(...Object.values(INVESTMENT_TRANSACTION_CATEGORY)),
    allowNull: false,
    defaultValue: INVESTMENT_TRANSACTION_CATEGORY.buy,
  })
  category: INVESTMENT_TRANSACTION_CATEGORY;

  /**
   * "transferNature" and "transferId" are used to move funds between different
   * accounts and don't affect income/expense stats.
   */
  @Column({
    type: DataType.ENUM(...Object.values(TRANSACTION_TRANSFER_NATURE)),
    allowNull: false,
    defaultValue: TRANSACTION_TRANSFER_NATURE.not_transfer,
  })
  transferNature: TRANSACTION_TRANSFER_NATURE;

  // (hash, used to connect two transactions)
  @Column({ allowNull: true, defaultValue: null })
  transferId: string;

  @Column
  updatedAt: Date;

  @Column
  createdAt: Date;

  @BelongsTo(() => Account)
  account: Account;

  @BelongsTo(() => Security)
  security: Security;
}
