import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import { format } from 'date-fns';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as helpers from '@tests/helpers';

describe('get exchange rates', () => {
  const todayFormatted = format(new Date(), 'yyyy-MM-dd');

  let mock: MockAdapter;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should successfully fetch and store exchange rates', async () => {
    const response = await helpers.getExchangeRates({
      date: todayFormatted,
      raw: true,
    });

    expect(response).toEqual(null);
  });
});
