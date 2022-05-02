import {
  Table,
  Column,
  Model,
  Unique,
  AllowNull,
  AutoIncrement,
  PrimaryKey,
} from 'sequelize-typescript';

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

export const getTransactionTypes = async () => {
  const accountTypes = await TransactionTypes.findAll();

  return accountTypes;
};

export const getTransactionTypeById = async (id: number) => {
  const accountTypes = await TransactionTypes.findOne({ where: { id } });

  return accountTypes;
};
