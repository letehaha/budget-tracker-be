import { calculateNewBalance } from './update-account-balance';

describe('calculates new balance for the previous balance correctly', () => {
  it.each([
    { amount: 0, previousAmount: 0, currentBalance: 0, expected: 0 },
    { amount: 10, previousAmount: 0, currentBalance: 0, expected: 10 },
    { amount: -10, previousAmount: 0, currentBalance: 0, expected: -10 },

    { amount: 0, previousAmount: -10.3, currentBalance: 0, expected: 10.3 },
    { amount: 0, previousAmount: 10, currentBalance: 0, expected: -10 },

    { amount: 0, previousAmount: 10, currentBalance: 10, expected: 0 },
  ])(
    'amount: $amount, previousAmount: $previousAmount, currentBalance: $currentBalance, expected: expected$',
    ({ amount, previousAmount, currentBalance, expected }) => {
      const newBalance = calculateNewBalance(amount, previousAmount, currentBalance);

      expect(newBalance).toBe(expected);
    },
  );
});
