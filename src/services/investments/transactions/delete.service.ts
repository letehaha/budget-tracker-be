import { TRANSACTION_TYPES, InvestmentTransactionModel } from 'shared-types';
import { GenericSequelizeModelAttributes } from '@common/types';
import { connection } from '@models/index';
import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import Holding from '@models/investments/Holdings.model';
import { updateAccountBalanceForChangedTx } from '@services/accounts.service';

type DeletionParams = Pick<InvestmentTransactionModel, 'id'>;

/**
 *
 * 1. Delete from the list
 * 2. Update holdings `quantity`, recalculate holdings `value` and `costBasis` based on new amount
 * 3. Update account balance
 */
export async function deleteInvestmentTransaction(
  { params, userId }: { params: DeletionParams; userId: number },
  { transaction }: GenericSequelizeModelAttributes = {},
) {
  const isTxPassedFromAbove = transaction !== undefined;
  transaction = transaction ?? (await connection.sequelize.transaction());

  try {
    const currentTx = await InvestmentTransaction.findByPk(params.id);

    await InvestmentTransaction.destroy({
      where: { id: currentTx.id },
      transaction,
    });

    const currentHolding = await Holding.findOne({
      where: {
        accountId: currentTx.accountId,
        securityId: currentTx.securityId,
      },
      transaction,
    });

    const newQuantity =
      currentTx.transactionType === TRANSACTION_TYPES.income
        ? parseFloat(currentHolding.quantity) - parseFloat(currentTx.quantity)
        : parseFloat(currentHolding.quantity) + parseFloat(currentTx.quantity);

    const newValue =
      currentTx.transactionType === TRANSACTION_TYPES.income
        ? parseFloat(currentHolding.value) - parseFloat(currentTx.amount)
        : parseFloat(currentHolding.value) + parseFloat(currentTx.amount);

    const newRefValue =
      currentTx.transactionType === TRANSACTION_TYPES.income
        ? parseFloat(currentHolding.refValue) - parseFloat(currentTx.refAmount)
        : parseFloat(currentHolding.refValue) + parseFloat(currentTx.refAmount);

    const newCostBasis =
      currentTx.transactionType === TRANSACTION_TYPES.income
        ? parseFloat(currentHolding.costBasis) -
          parseFloat(currentTx.amount) -
          parseFloat(currentTx.fees)
        : parseFloat(currentHolding.costBasis) +
          parseFloat(currentTx.amount) +
          parseFloat(currentTx.fees);

    const newRefCostBasis =
      currentTx.transactionType === TRANSACTION_TYPES.income
        ? parseFloat(currentHolding.refCostBasis) -
          parseFloat(currentTx.refAmount) -
          parseFloat(currentTx.refFees)
        : parseFloat(currentHolding.refCostBasis) +
          parseFloat(currentTx.refAmount) +
          parseFloat(currentTx.refFees);

    await Holding.update(
      {
        value: String(newValue),
        refValue: String(newRefValue),
        quantity: String(newQuantity),
        costBasis: String(newCostBasis),
        refCostBasis: String(newRefCostBasis),
      },
      {
        where: {
          accountId: currentHolding.accountId,
          securityId: currentHolding.securityId,
        },
        transaction,
      },
    );

    const updatedHolding = await Holding.findOne({
      where: {
        accountId: currentHolding.accountId,
        securityId: currentHolding.securityId,
      },
      transaction,
    });

    // Recalculate account balance

    // TODO: maybe not "old costBasis - new costBasis", but "old value - new value"?
    const costBasisDiff =
      parseFloat(currentHolding.costBasis) -
      parseFloat(updatedHolding.costBasis);
    const refCostBasisDiff =
      parseFloat(currentHolding.refCostBasis) -
      parseFloat(updatedHolding.refCostBasis);

    await updateAccountBalanceForChangedTx(
      {
        userId,
        accountId: currentTx.accountId,
        transactionType: currentTx.transactionType,
        // We store amounts in Account as integer, so need to mutiply that by 100
        prevAmount: Math.floor(costBasisDiff * 100),
        prevRefAmount: Math.floor(refCostBasisDiff * 100),
      },
      { transaction },
    );

    if (!isTxPassedFromAbove) {
      await transaction.commit();
    }
  } catch (err) {
    if (!isTxPassedFromAbove) {
      await transaction.rollback();
    }

    throw err;
  }
}
