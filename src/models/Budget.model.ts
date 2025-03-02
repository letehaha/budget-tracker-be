import { Table, Column, Model, ForeignKey, BelongsToMany } from 'sequelize-typescript';
import Users from '@models/Users.model';
import Categories from '@models/Categories.model';
import Transactions from '@models/Transactions.model';
import BudgetTransactions from '@models/BudgetTransactions.model';

@Table({
  timestamps: false,
})
export default class Budgets extends Model {
  @Column({ primaryKey: true, autoIncrement: true, allowNull: false })
  id: number;

  @Column({ allowNull: false })
  name: string;

  @Column({ allowNull: true })
  start_date: Date;

  @Column({ allowNull: true })
  end_date: Date;

  @Column({ defaultValue: false })
  auto_include: boolean;

  @Column({ allowNull: true })
  limit_amount: number;

  @ForeignKey(() => Users)
  @Column({ allowNull: false })
  userId: number;

  @ForeignKey(() => Categories)
  @Column({ allowNull: true })
  category_id: number;

  @BelongsToMany(() => Transactions, {
    through: { model: () => BudgetTransactions, unique: false },
    foreignKey: 'budget_id',
    otherKey: 'transaction_id',
  })
  transactions: Transactions[];

  public setTransactions!: (transactions: Transactions[]) => Promise<void>;
  public getTransactions!: () => Promise<Transactions[]>;
  public addTransactions!: (transactions: Transactions[]) => Promise<void>;
}

export const getBudgets = async ({ userId }: { userId: number }) => {
  const budgets = await Budgets.findAll({
    where: { userId },
    include: [{ model: Transactions, as: 'transactions' }],
  });
  return budgets.map(budget => ({
    ...budget.toJSON(),
    transactions: budget.transactions.map(t => t.toJSON()),
  }));
};

export interface CreateBudgetPayload {
  userId: number;
  name: string;
  start_date?: Date | null;
  end_date?: Date | null;
  auto_include?: boolean;
  limit_amount?: number | null;
  category_id?: number | null;
}

export interface DeleteBudgetPayload {
  id: number;
  userId?: number;
}

export const createBudget = async ({
  name,
  userId,
  start_date,
  end_date,
  auto_include,
  limit_amount,
  category_id,
}: CreateBudgetPayload) => {
  if (!name || !userId) {
    throw new Error('Name and userId are required fields');
  }

  const budgetData = {
    name,
    userId,
    start_date: start_date || null,
    end_date: end_date || null,
    auto_include: auto_include ?? false,
    limit_amount: limit_amount ?? null,
    category_id: category_id ?? null,
  };

  if (start_date && end_date && start_date > end_date) {
    throw new Error('Start date cannot be later than end date');
  }

  const budget = await Budgets.create(budgetData);
  return budget;
};

export const deleteBudget = async ({ id, userId }: DeleteBudgetPayload) => {
  const budget = await Budgets.findOne({
    where: { id, userId },
  });

  if (!budget) {
    throw new Error('Budget not found');
  }

  await BudgetTransactions.destroy({
    where: { budget_id: id },
  });

  await budget.destroy();

  return { success: true };
};