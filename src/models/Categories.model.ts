import { Transaction } from 'sequelize/types';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsToMany,
} from 'sequelize-typescript';
import { CATEGORY_TYPES } from '../js/const';
import Users from './Users.model';
import UserMerchantCategoryCodes from './UserMerchantCategoryCodes.model';
import MerchantCategoryCodes from './MerchantCategoryCodes.model';

// TODO: move to global types
enum CategoryTypes {
  internal = 'internal',
  custom = 'custom',
}

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
    type: DataType.ENUM({ values: Object.keys(CategoryTypes) }),
  })
  type: CategoryTypes;

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
    type = CategoryTypes.custom,
    parentId,
    userId,
  }: {
    name: string;
    imageUrl?: string;
    color?: string;
    type?: CategoryTypes;
    parentId?: number;
    userId: number;
  },
  { transaction }: { transaction?: Transaction } = {},
) => {
  if (parentId) {
    if (!color) {
      throw new Error("'color' is required for subcategories. Use the parent color, or define a custom one");
    }
    const parent = await Categories.findOne(
      {
        where: { id: parentId, userId },
        transaction,
      },
    );

    if (!parent) {
      throw new Error("Category with such parentId doesn't exist");
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
