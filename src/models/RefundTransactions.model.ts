import { Transaction } from 'sequelize/types';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import Transactions from './Transactions.model';

@Table({
  tableName: 'RefundTransactions',
  timestamps: true,
  indexes: [
    {
      fields: ['original_tx_id'],
    },
  ],
})
export default class RefundTransactions extends Model {
  @ForeignKey(() => Transactions)
  @Column({
    allowNull: false,
    primaryKey: true,
  })
  original_tx_id: number;

  @ForeignKey(() => Transactions)
  @Column({
    allowNull: false,
    primaryKey: true,
  })
  refund_tx_id: number;

  @BelongsTo(() => Transactions, 'original_tx_id')
  originalTransaction: Transactions;

  @BelongsTo(() => Transactions, 'refund_tx_id')
  refundTransaction: Transactions;
}

export const createRefundTransaction = async (
  {
    original_tx_id,
    refund_tx_id,
  }: { original_tx_id: number; refund_tx_id: number },
  { transaction }: { transaction?: Transaction } = {},
) => {
  return RefundTransactions.create(
    { original_tx_id, refund_tx_id },
    { transaction },
  );
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
  { data }: { data: Array<{ original_tx_id: number; refund_tx_id: number }> },
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
