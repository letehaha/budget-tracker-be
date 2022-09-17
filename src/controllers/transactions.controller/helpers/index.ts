import { ValidationError } from '@js/errors'

export const validateTransactionAmount = (amount): void => {
  if (amount === 0) throw new ValidationError({ message: 'Amount cannot be 0.' });
  if (amount < 0) throw new ValidationError({ message: 'Amount should be positive.' });
  if (!Number.isInteger(amount)) throw new ValidationError({ message: 'Amount should be an integer.' });
};
