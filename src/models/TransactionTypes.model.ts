import {
  Table,
  Column,
  Model,
  Unique,
  AllowNull,
  AutoIncrement,
  PrimaryKey,
} from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';

@Table({
  timestamps: false,
})
export default class TransactionTypes extends Model {
  @Unique
  @AllowNull(false)
  @AutoIncrement
  @PrimaryKey
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Column
  type: number;
}

export const getTransactionTypes = async (
  { transaction }: { transaction?: Transaction } = {},
) => {
  const accountTypes = await TransactionTypes.findAll({ transaction });

  return accountTypes;
};

export const getTransactionTypeById = async (
  id: number,
  { transaction }: { transaction?: Transaction } = {},
) => {
  const accountTypes = await TransactionTypes.findOne({ where: { id }, transaction });

  return accountTypes;
};
