import {
  Table,
  Column,
  Model,
} from 'sequelize-typescript';

@Table({
  timestamps: false,
})
export default class TransactionEntities extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  type: number;

  @Column({ allowNull: false })
  name: string;
}

export const getTransactionEntities = async () => {
  const result = await TransactionEntities.findAll();

  return result;
};

export const getTransactionEntityByType = async ({ type }) => {
  const result = await TransactionEntities.findOne({ where: { type } });

  return result;
};
