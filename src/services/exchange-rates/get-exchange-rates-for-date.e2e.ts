import { describe, it, expect } from '@jest/globals';
import { format } from 'date-fns';
import * as helpers from '@tests/helpers';

describe('get exchange rates', () => {
  const todayFormatted = format(new Date(), 'yyyy-MM-dd');

  it('should successfully fetch and store exchange rates', async () => {
    const response = await helpers.getExchangeRates({
      date: todayFormatted,
      raw: true,
    });

    expect(response).toEqual(null);
  });
});
