import {
  Table,
  Column,
  Model,
} from 'sequelize-typescript';

@Table({
  timestamps: false,
})
export default class AccountTypes extends Model {
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

export const getAccountTypes = async () => {
  const accountTypes = await AccountTypes.findAll();

  return accountTypes;
};
