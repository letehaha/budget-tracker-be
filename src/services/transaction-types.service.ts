import * as TransactionTypes from '../models/TransactionTypes.model';

export const getTransactionTypes = async () => {
  const data = await TransactionTypes.getTransactionTypes();

  return data;
};

export const getTransactionTypeById = async (id: number) => {
  const data = await TransactionTypes.getTransactionTypeById(id);

  return data;
};
