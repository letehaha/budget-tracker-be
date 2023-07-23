import { GenericSequelizeModelAttributes } from '@common/types';
import * as Transactions from '@models/Transactions.model';

export const getTransactionBySomeId = async (
  payload: Transactions.GetTransactionBySomeIdPayload,
  attributes: GenericSequelizeModelAttributes = {},
) => Transactions.getTransactionBySomeId(payload, attributes);
