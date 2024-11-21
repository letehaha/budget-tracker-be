import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as helpers from '@tests/helpers';
import { format } from 'date-fns';
import { getApiLayerResposeMock } from '@tests/mocks/exchange-rates';

const API_ENDPOINT_REGEX = /https:\/\/api.apilayer.com\/fixer/;

describe('Exchange Rates Functionality', () => {
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
    const date = '2024-11-17';
    const mockExchangeRates = getApiLayerResposeMock(date);
    mock.onGet(API_ENDPOINT_REGEX).reply(200, mockExchangeRates);

    await expect(helpers.getExchangeRates({ date, raw: true })).resolves.toBe(null);
    await expect(helpers.syncExchangeRates().then((r) => r.statusCode)).resolves.toEqual(200);

    const response = await helpers.getExchangeRates({ date, raw: true });
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBeGreaterThan(0);

    response.forEach((item) => {
      expect(item).toMatchObject({
        date: expect.stringContaining(date),
      });
    });
  });

  it('should successfully resolve when trying to sync data for the date with existing rates. No external API call should happen', async () => {
    // Imitate today's date, because `sync` actually happens only for today
    const date = format(new Date(), 'yyyy-MM-dd');
    const mockExchangeRates = getApiLayerResposeMock(date);
    mock.onGet(API_ENDPOINT_REGEX).reply(200, mockExchangeRates);

    await expect(helpers.getExchangeRates({ date, raw: true })).resolves.toBe(null);

    // First call to sync real data
    await expect(helpers.syncExchangeRates().then((r) => r.statusCode)).resolves.toEqual(200);
    // Second call should silently succeed with no external being API called
    await expect(helpers.syncExchangeRates().then((r) => r.statusCode)).resolves.toEqual(200);

    expect(mock.history.get.length).toBe(1);
  });

  it('should return validation error if API returns something not related to base currency', async () => {
    const date = '2024-11-17';
    const mockExchangeRates = {
      ...getApiLayerResposeMock(date),
      base: 'EUR',
    };
    mock.onGet(API_ENDPOINT_REGEX).reply(200, mockExchangeRates);

    await expect(helpers.syncExchangeRates().then((r) => r.statusCode)).resolves.toEqual(422);
  });

  it('should handle 400 Bad Request error', async () => {
    mock.onGet(API_ENDPOINT_REGEX).reply(400);
    await expect(helpers.syncExchangeRates().then((m) => m.statusCode)).resolves.toBe(502);
  });

  it('should handle 401 Unauthorized error', async () => {
    mock.onGet(API_ENDPOINT_REGEX).reply(401);
    await expect(helpers.syncExchangeRates().then((m) => m.statusCode)).resolves.toBe(502);
  });

  it('should handle 404 Not Found error', async () => {
    mock.onGet(API_ENDPOINT_REGEX).reply(404);
    await expect(helpers.syncExchangeRates().then((m) => m.statusCode)).resolves.toBe(502);
  });

  it('should handle 429 Too Many Requests error', async () => {
    mock.onGet(API_ENDPOINT_REGEX).reply(429);
    await expect(helpers.syncExchangeRates().then((m) => m.statusCode)).resolves.toBe(429);
  });

  it('should handle 500 Server Error', async () => {
    mock.onGet(API_ENDPOINT_REGEX).reply(500);
    await expect(helpers.syncExchangeRates().then((m) => m.statusCode)).resolves.toBe(502);
  });

  it('should handle 5xx Error', async () => {
    mock.onGet(API_ENDPOINT_REGEX).reply(503);
    await expect(helpers.syncExchangeRates().then((m) => m.statusCode)).resolves.toBe(502);
  });
});
