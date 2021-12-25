import {
  Table,
  Column,
  Model,
} from 'sequelize-typescript';

@Table({
  timestamps: false,
})
export default class PaymentTypes extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  name: string;
}

export const getPaymentTypes = async () => {
  const accountTypes = await PaymentTypes.findAll();

  return accountTypes;
};
