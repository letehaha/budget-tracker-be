import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as helpers from '@tests/helpers';
import { format } from 'date-fns';

const getRealisticMock = (date: string) => ({
  base: 'USD',
  date,
  historical: true,
  rates: {
    AED: 3.672898,
    AFN: 68.266085,
    ALL: 93.025461,
    AMD: 389.644872,
    ANG: 1.80769,
    AOA: 912.000052,
    ARS: 998.338958,
    AUD: 1.54724,
    AWG: 1.795,
    AZN: 1.699441,
    BAM: 1.85463,
    BBD: 2.025224,
    BDT: 119.861552,
    BGN: 1.857551,
    BHD: 0.376464,
    BIF: 2962.116543,
    BMD: 1,
    BND: 1.344649,
    BOB: 6.930918,
    BRL: 5.79695,
    BSD: 1.002987,
    BTC: 1.1159782e-5,
    BTN: 84.270352,
    BWP: 13.71201,
    BYN: 3.282443,
    BYR: 19600,
    BZD: 2.02181,
    CAD: 1.40868,
    CDF: 2864.999929,
    CHF: 0.888731,
    CLF: 0.035528,
    CLP: 975.269072,
    CNH: 7.24003,
    CNY: 7.232505,
    COP: 4499.075435,
    CRC: 510.454696,
    CUC: 1,
    CUP: 26.5,
    CVE: 104.561187,
    CZK: 23.997008,
    DJF: 178.606989,
    DKK: 7.08093,
    DOP: 60.43336,
    DZD: 133.184771,
    EGP: 49.351845,
    ERN: 15,
    ETB: 121.465364,
    EUR: 0.949355,
    FJD: 2.27595,
    FKP: 0.789317,
    GBP: 0.79257,
    GEL: 2.734996,
    GGP: 0.789317,
    GHS: 16.022948,
    GIP: 0.789317,
    GMD: 70.999809,
    GNF: 8643.497226,
    GTQ: 7.746432,
    GYD: 209.748234,
    HKD: 7.786599,
    HNL: 25.330236,
    HRK: 7.133259,
    HTG: 131.85719,
    HUF: 387.294505,
    IDR: 15898.3,
    ILS: 3.749297,
    IMP: 0.789317,
    INR: 84.47775,
    IQD: 1313.925371,
    IRR: 42092.500857,
    ISK: 137.650273,
    JEP: 0.789317,
    JMD: 159.290693,
    JOD: 0.7091,
    JPY: 154.671022,
    KES: 129.894268,
    KGS: 86.49797,
    KHR: 4051.965293,
    KMF: 466.575027,
    KPW: 899.999621,
    KRW: 1395.925003,
    KWD: 0.30754,
    KYD: 0.835902,
    KZT: 498.449576,
    LAK: 22039.732587,
    LBP: 89819.638708,
    LKR: 293.025461,
    LRD: 184.552653,
    LSL: 18.247689,
    LTL: 2.95274,
    LVL: 0.60489,
    LYD: 4.898772,
    MAD: 9.999526,
    MDL: 18.224835,
    MGA: 4665.497131,
    MKD: 58.423024,
    MMK: 3247.960992,
    MNT: 3397.999946,
    MOP: 8.042767,
    MRU: 40.039827,
    MUR: 47.209928,
    MVR: 15.450211,
    MWK: 1739.225262,
    MXN: 20.370255,
    MYR: 4.470499,
    MZN: 63.88816,
    NAD: 18.247689,
    NGN: 1665.819989,
    NIO: 36.906737,
    NOK: 11.103013,
    NPR: 134.832867,
    NZD: 1.70571,
    OMR: 0.384524,
    PAB: 1.002987,
    PEN: 3.80769,
    PGK: 4.033,
    PHP: 58.731501,
    PKR: 278.485894,
    PLN: 4.105698,
    PYG: 7826.086957,
    QAR: 3.656441,
    RON: 4.72391,
    RSD: 110.944953,
    RUB: 99.98595,
    RWF: 1377.554407,
    SAR: 3.756134,
    SBD: 8.390419,
    SCR: 13.840265,
    SDG: 601.493717,
    SEK: 10.98595,
    SGD: 1.342479,
    SHP: 0.789317,
    SLE: 22.603248,
    SLL: 20969.504736,
    SOS: 573.230288,
    SRD: 35.315502,
    STD: 20697.981008,
    SVC: 8.776255,
    SYP: 2512.529858,
    SZL: 18.240956,
    THB: 34.786985,
    TJS: 10.692144,
    TMT: 3.51,
    TND: 3.164478,
    TOP: 2.342096,
    TRY: 34.45328,
    TTD: 6.810488,
    TWD: 32.476799,
    TZS: 2667.962638,
    UAH: 41.429899,
    UGX: 3681.191029,
    USD: 1,
    UYU: 43.042056,
    UZS: 12838.651558,
    VES: 45.732111,
    VND: 25390,
    VUV: 118.722009,
    WST: 2.791591,
    XAF: 622.025509,
    XAG: 0.03291,
    XAU: 0.000389,
    XCD: 2.70255,
    XDR: 0.755583,
    XOF: 622.025509,
    XPF: 113.090892,
    YER: 249.874979,
    ZAR: 18.184065,
    ZMK: 9001.198917,
    ZMW: 27.537812,
    ZWL: 321.999592,
  },
  success: true,
  timestamp: 1731887999,
});

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
    const mockExchangeRates = getRealisticMock(date);
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
    const mockExchangeRates = getRealisticMock(date);
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
      ...getRealisticMock(date),
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
