import { TRANSACTION_TYPES, InvestmentTransactionModel } from 'shared-types';
import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import Holding from '@models/investments/Holdings.model';
import { updateAccountBalanceForChangedTx } from '@services/accounts';
import { withTransaction } from '@root/services/common';
import Accounts from '@models/Accounts.model';

type DeletionParams = Pick<InvestmentTransactionModel, 'id'>;

/**
 *
 * 1. Delete from the list
 * 2. Update holdings `quantity`, recalculate holdings `value` and `costBasis` based on new amount
 * 3. Update account balance
 */
export const deleteInvestmentTransaction = withTransaction(
  async ({ params, userId }: { params: DeletionParams; userId: number }) => {
    const currentTx = await InvestmentTransaction.findByPk(params.id);

    // If no transaction found - nothing to delete
    if (!currentTx) return undefined;

    await InvestmentTransaction.destroy({
      where: { id: currentTx.id },
    });

    const currentHolding = await Holding.findOne({
      where: {
        accountId: currentTx.accountId,
        securityId: currentTx.securityId,
      },
    });

    // If no holding found - nothing to update
    if (!currentHolding) return undefined;

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

    const [, updatedHoldings] = await Holding.update(
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
        returning: true,
      },
    );
    // TODO: when holding quantity turns to 0, make 0 all other fields too.
    // `costBasis` cannot be positive or negative when `quantity` is 0
    const updatedHolding = updatedHoldings[0]!;

    // Recalculate account balance

    // TODO: maybe not "old costBasis - new costBasis", but "old value - new value"?

    const account = (await Accounts.findOne({
      where: {
        id: currentTx.accountId,
        userId,
      },
    }))!;

    const costBasisDiff =
      parseFloat(currentHolding.costBasis) - parseFloat(updatedHolding.costBasis);
    const refCostBasisDiff =
      parseFloat(currentHolding.refCostBasis) - parseFloat(updatedHolding.refCostBasis);

    await updateAccountBalanceForChangedTx({
      userId,
      accountId: currentTx.accountId,
      transactionType: currentTx.transactionType,
      // We store amounts in Account as integer, so need to mutiply that by 100
      prevAmount: Math.floor(costBasisDiff * 100),
      prevRefAmount: Math.floor(refCostBasisDiff * 100),
      accountType: account.type,
      time: new Date(currentTx.date).toISOString(),
    });
  },
);
