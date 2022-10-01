import { Transaction } from 'sequelize/types';
import { ERROR_CODES, CATEGORY_TYPES } from 'shared-types';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import Users from './Users.model';
import UserMerchantCategoryCodes from './UserMerchantCategoryCodes.model';
import MerchantCategoryCodes from './MerchantCategoryCodes.model';

@Table({
  timestamps: false,
})
export default class Categories extends Model {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ allowNull: false })
  name: string;

  @Column({ allowNull: true })
  imageUrl: string;

  @Column({ allowNull: false })
  color: string;

  @Column({
    allowNull: false,
    defaultValue: CATEGORY_TYPES.custom,
    type: DataType.ENUM({ values: Object.values(CATEGORY_TYPES) }),
  })
  type: CATEGORY_TYPES;

  @Column({ allowNull: true })
  parentId: number;

  @ForeignKey(() => Users)
  @Column
  userId: number;

  @BelongsToMany(
    () => MerchantCategoryCodes,
    {
      as: 'merchantCodes',
      through: () => UserMerchantCategoryCodes,
    }
  )
  categoryId: number;
}

export const getCategories = async ({ id }) => {
  const categories = await Categories.findAll({ where: { userId: id } });

  return categories;
};

export const createCategory = async (
  {
    name,
    imageUrl,
    color,
    type = CATEGORY_TYPES.custom,
    parentId,
    userId,
  }: {
    name: string;
    imageUrl?: string;
    color?: string;
    type?: CATEGORY_TYPES;
    parentId?: number;
    userId: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  if (parentId) {
    if (!color) {
      throw ({
        code: ERROR_CODES.validationError,
        message: '"color" is required for subcategories. Use the parent color, or define a custom one',
      })
    }
    const parent = await Categories.findOne(
      {
        where: { id: parentId, userId },
        transaction,
      },
    );

    if (!parent) {
      throw ({
        code: ERROR_CODES.validationError,
        message: "Category with such parentId doesn't exist.",
      })
    }
  }

  const category = await Categories.create(
    {
      name,
      imageUrl,
      color,
      type,
      parentId,
      userId,
    },
    { transaction },
  );

  return category;
};

export const bulkCreate = (
  { data },
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
  return Categories.bulkCreate(data, {
    transaction,
    validate,
    returning,
  });
}
