import { Transaction } from 'sequelize/types';
import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import Transactions from './Transactions.model';

@Table({
  tableName: 'RefundTransactions',
  timestamps: true,
  indexes: [
    {
      fields: ['original_tx_id'],
    },
    {
      fields: ['refund_tx_id'],
      unique: true,
    },
  ],
})
export default class RefundTransactions extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => Transactions)
  @Column({
    // Can be nullish to support cases like when user has account_A in the system, he receives tx_A,
    // but in fact it's a refund for some tx_B in an "out of system" account. It is important to
    // consider that not all user real-life accounts will be present in the system
    allowNull: true,
  })
  original_tx_id: number | null;

  @ForeignKey(() => Transactions)
  @Column({
    allowNull: false,
    unique: true,
  })
  refund_tx_id: number;

  @BelongsTo(() => Transactions, 'original_tx_id')
  originalTransaction: Transactions;

  @BelongsTo(() => Transactions, 'refund_tx_id')
  refundTransaction: Transactions;
}

export const createRefundTransaction = async (
  { original_tx_id, refund_tx_id }: { original_tx_id: number | null; refund_tx_id: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return RefundTransactions.create({ original_tx_id, refund_tx_id }, { transaction });
};

export const getRefundsForTransaction = async (
  originalTxId: number,
  { transaction }: { transaction?: Transaction } = {},
) => {
  return RefundTransactions.findAll({
    where: { original_tx_id: originalTxId },
    include: [{ model: Transactions, as: 'refundTransaction' }],
    transaction,
  });
};

export const bulkCreateRefundTransactions = (
  { data }: { data: Array<{ original_tx_id: number | null; refund_tx_id: number }> },
  {
    transaction,
    validate = true,
    returning = false,
  }: {
    transaction: Transaction;
    validate?: boolean;
    returning?: boolean;
  },
) => {
  return RefundTransactions.bulkCreate(data, {
    transaction,
    validate,
    returning,
  });
};
