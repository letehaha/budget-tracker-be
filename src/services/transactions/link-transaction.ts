import { logger} from '@js/utils/logger';
import * as Transactions from '@models/Transactions.model';
import { v4 as uuidv4 } from 'uuid';

export const linkTransactions = async (prevData, linkData, transaction) => {
  try {
    const transferId = uuidv4();

    await Transactions.updateTransactionById({
      id: prevData.id,
      userId: prevData.userId,
      isTransfer: true,
      transferId,
    }, { transaction });

    await Transactions.updateTransactionById({
      id: linkData.id,
      userId: prevData.userId,
      isTransfer: true,
      transferId,
    }, { transaction });

    return {
      linkedBaseTransaction: { ...prevData, isTransfer: true, transferId },
      linkedLinkTransaction: { ...linkData, isTransfer: true, transferId }
    };
  } catch (e) {
    logger.error(e);
    throw e;
  }
};

