import { MonobankTrasnactionModel } from 'shared-types';
import * as MonobankTransactions from '@models/banks/monobank/Transactions.model';
import { GenericSequelizeModelAttributes } from '@common/types';


export const getTransactionByOriginalId = async (
  payload: MonobankTransactions.GetTransactionByOriginalIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankTrasnactionModel> => {
  const user = await MonobankTransactions.getTransactionByOriginalId(
    payload,
    attributes,
  );

  return user;
}

export const createTransaction = async (
  payload: MonobankTransactions.CreateTransactionPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankTrasnactionModel> => {
  const user = await MonobankTransactions.createTransaction(
    payload,
    attributes,
  );

  return user;
}

export const getTransactions = async (
  payload: MonobankTransactions.GetTransactionsPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankTrasnactionModel[]> => {
  const user = await MonobankTransactions.getTransactions(
    payload,
    attributes,
  );

  return user;
}

export const updateTransactionById = async (
  payload: MonobankTransactions.UpdateTransactionByIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
): Promise<MonobankTrasnactionModel> => {
  const user = await MonobankTransactions.updateTransactionById(
    payload,
    attributes,
  );

  return user;
}

export const deleteTransactionById = async (
  payload: MonobankTransactions.DeleteTransactionByIdPayload,
  attributes: GenericSequelizeModelAttributes = {}
) => MonobankTransactions.deleteTransactionById(payload, attributes);
