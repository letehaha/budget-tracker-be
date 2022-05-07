import { Transaction } from 'sequelize/types';
import * as Categories from '@models/Categories.model';

export const bulkCreate = (
  { data }: { data: unknown },
  {
    transaction,
    validate,
    returning,
  }: {
    transaction: Transaction;
    validate?: boolean;
    returning?: boolean;
  },
) => {
  return Categories.bulkCreate({ data }, { transaction, validate, returning });
}
