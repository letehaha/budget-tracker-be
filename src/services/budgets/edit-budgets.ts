import { withTransaction } from '@services/common/index';
import Budgets, { editBudget } from '@models/Budget.model';
import Transactions, { getTransactionById } from '@models/Transactions.model';

export const editBudgets = withTransaction(async ({ id, userId, name, transactionIds }) => {
  
  const budget = await editBudget({ id, userId, name });

  if (transactionIds) {
    const ids = Array.isArray(transactionIds) ? transactionIds : [transactionIds];
    
    const transactions = await Promise.all(
      ids.map(async (transactionId) => {
        const transaction = await getTransactionById({
          id: transactionId,
          userId,
        });
        if (!transaction) {
          throw new Error(`Transaction with ID ${transactionId} not found or does not belong to user`);
        }
        return transaction;
      }),
    );

    await budget.addTransactions(transactions);
  }

  const updatedBudget = await Budgets.findByPk(id, {
    include: [{ model: Transactions, as: 'transactions' }],
  });

  if (!updatedBudget) {
    throw new Error('Updated budget not found');
  }

  return {
    ...updatedBudget.toJSON(),
    transactions: updatedBudget.transactions.map(t => t.toJSON()),
  };
});