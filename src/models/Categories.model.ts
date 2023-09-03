import { Transaction } from 'sequelize/types';
import { API_ERROR_CODES, CATEGORY_TYPES } from 'shared-types';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { GenericSequelizeModelAttributes } from '@common/types';
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

export const getCategories = async (
  { userId }: { userId: number; },
  attributes: GenericSequelizeModelAttributes = {},
) => {
  const categories = await Categories.findAll({
    where: { userId },
    raw: attributes.raw ?? true,
    transaction: attributes.transaction,
  });

  return categories;
};

export interface CreateCategoryPayload {
  userId: number;
  name?: string;
  imageUrl?: string;
  color?: string;
  parentId?: number;
  type?: CATEGORY_TYPES;
}

export const createCategory = async (
  {
    parentId,
    color,
    userId,
    ...params
  }: CreateCategoryPayload,
  { transaction }: { transaction?: Transaction } = {},
) => {
  if (parentId) {
    const parent = await Categories.findOne(
      {
        where: { id: parentId, userId },
        transaction,
      },
    );

    if (!parent) {
      throw ({
        code: API_ERROR_CODES.validationError,
        message: "Category with such parentId doesn't exist.",
      })
    }

    if (!color) color = parent.get('color');
  }

  const category = await Categories.create({
    parentId,
    color,
    userId,
    ...params
  }, { transaction });

  return category;
};

export interface EditCategoryPayload {
  userId: number;
  categoryId: number;
  name?: string;
  imageUrl?: string;
  color?: string;
}

export const editCategory = async (
  {
    userId,
    categoryId,
    ...params
  }: EditCategoryPayload,
  { transaction }: { transaction?: Transaction } = {},
) => {
  const [, categories] = await Categories.update(params, {
    where: {
      id: categoryId,
      userId,
    },
    returning: true,
    transaction,
  });

  return categories;
};

export interface DeleteCategoryPayload {
  userId: number;
  categoryId: number;
}

export const deleteCategory = async (
  { userId, categoryId }: DeleteCategoryPayload,
  { transaction }: { transaction?: Transaction } = {},
) => {
  return Categories.destroy({
    where: { userId, id: categoryId },
    transaction,
  });
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
