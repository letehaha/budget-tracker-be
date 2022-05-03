import { Transaction } from 'sequelize/types';
import * as TransactionTypes from '@models/TransactionTypes.model';

export const getTransactionTypes = async (
  { transaction }: { transaction?: Transaction } = {},
) => {
  const data = await TransactionTypes.getTransactionTypes({ transaction });

  return data;
};

export const getTransactionTypeById = async (
  id: number,
  { transaction }: { transaction?: Transaction } = {},
) => {
  const data = await TransactionTypes.getTransactionTypeById(id, { transaction });

  return data;
};
