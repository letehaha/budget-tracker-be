import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import { errorHandler } from '@controllers/helpers';

import { removeRefundLink } from '@services/tx-refunds/remove-refund-link.service';
import { BadRequestError } from '@js/errors';

export const deleteRefund = async (req, res: CustomResponse) => {
  try {
    const { originalTxId, refundTxId } = req.body;
    const { id: userId } = req.user;

    const params: {
      originalTxId: number;
      refundTxId: number;
      userId: number;
    } = {
      originalTxId,
      refundTxId,
      userId,
    };

    if (!originalTxId || !refundTxId) {
      throw new BadRequestError({
        message: 'Missing required params',
      });
    }

    await removeRefundLink(params);

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
