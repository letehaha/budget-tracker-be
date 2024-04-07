import { ASSET_CLASS } from 'shared-types';
import { subDays, format } from 'date-fns';
import type { IRestClient } from '@polygon.io/client-js';
import { restClient, type IAggs } from '@polygon.io/client-js';
import type { SecurityAttributes } from '@models/investments/Security.model';
import { UnwrapPromise, UnwrapArray } from '@common/types';
import { requestsUtils, logger } from '@js/utils';

type ITickersResults = UnwrapArray<
  UnwrapPromise<
    ReturnType<ReturnType<typeof restClient>['reference']['tickers']>
  >['results']
>;

export type TickersResponse = (ITickersResults & {
  exchangeAcronym: string;
  exchangeMic: string;
  exchangeName: string;
})[];

export type EndOfDayPricing<TSecurity> = {
  security: TSecurity;
  pricing: {
    ticker: string;
    price: number;
    change: number;
    changePct: number;
    updatedAt: Date;
  };
};

export class PolygonMarketDataService {
  private readonly api: IRestClient;
  // Basic tier is 5 calls / minute. But we might introduce higher tier, and based
  // on .env we can disable rate limiting
  private shouldRateLimit = true;

  readonly source = 'polygon';
  // Basic accounts rate limited at 5 calls / minute
  readonly reateLimit = 15_000;

  constructor(apiKey: string) {
    this.api = restClient(apiKey, undefined, { trace: true });
  }

  async getExchangesList() {
    const data = await this.api.reference.exchanges({
      asset_class: 'stocks',
    });

    return data;
  }

  async getAllDailyPricing(): Promise<IAggs> {
    const date = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    return await this.api.stocks.aggregatesGroupedDaily(date, {
      adjusted: 'true',
    });
  }

  async getUSStockTickers(): Promise<TickersResponse> {
    const allExchanges = await this.api.reference.exchanges({
      locale: 'us',
      asset_class: 'stocks',
    });

    // Only get tickers for exchanges, not TRF or SIP
    const exchanges = allExchanges.results.filter(
      (exchange) => exchange.type === 'exchange',
    );

    const tickers: TickersResponse = [];

    for (const exchange of exchanges) {
      const exchangeTickers: TickersResponse =
        await requestsUtils.paginateWithNextUrl({
          pageSize: 1000,
          delay: this.shouldRateLimit
            ? {
                onDelay: (message: string) => logger.info(message),
                milliseconds: this.reateLimit,
              }
            : undefined,
          fetchData: async (limit, nextCursor) => {
            try {
              console.log(`loop over: ${exchange.name}, ${exchange.mic}`);
              const { results, next_url } = await requestsUtils.withRetry(
                () =>
                  this.api.reference.tickers({
                    market: 'stocks',
                    exchange: exchange.mic,
                    cursor: nextCursor,
                    limit: limit,
                  }),
                {
                  maxRetries: 1,
                  delay: this.shouldRateLimit ? this.reateLimit : 0,
                },
              );
              console.log('results', results);
              const tickersWithExchange = results.map((ticker) => {
                return {
                  ...ticker,
                  exchangeAcronym: exchange.acronymstring ?? '',
                  exchangeMic: exchange.mic ?? '',
                  exchangeName: exchange.name,
                };
              });
              return { data: tickersWithExchange, nextUrl: next_url };
            } catch (err) {
              logger.error('Error while fetching tickers', err);

              return { data: [], nextUrl: undefined };
            }
          },
        });
      tickers.push(...exchangeTickers);
    }
    return tickers;
  }

  async getEndOfDayPricing<
    TSecurity extends Pick<
      SecurityAttributes,
      'id' | 'symbol' | 'assetClass' | 'currencyCode'
    >,
  >(
    securities: TSecurity[],
    allPricing: IAggs,
  ): Promise<EndOfDayPricing<TSecurity>[]> {
    // Create a map for efficient lookup of securities by their ticker symbol
    const securitiesMap = new Map(
      securities.map((security) => [
        getPolygonTicker(security)?.ticker,
        security,
      ]),
    );

    const data = (allPricing.results || [])
      .filter(
        ({ t, c, T }) =>
          t !== null &&
          c !== null &&
          securitiesMap.has(T) &&
          securitiesMap.get(T)?.assetClass === 'stocks',
      )
      .map((pricing) => ({
        security: securitiesMap.get(pricing.T),
        pricing: {
          ticker: pricing.T,
          price: pricing.c,
          change: pricing.c - pricing.o,
          changePct: ((pricing.c - pricing.o) / pricing.o) * 100,
          updatedAt: new Date(pricing.t),
        },
      }));

    return data;
  }
}

export const marketDataService = new PolygonMarketDataService(
  process.env.POLYGON_API_KEY,
);

class PolygonTicker {
  constructor(
    readonly market: 'stocks' | 'options' | 'fx' | 'crypto',
    readonly ticker: string,
  ) {}

  get key() {
    return `${this.market}|${this.ticker}`;
  }

  /** override so this object can be used directly in string interpolation for cache keys */
  toString() {
    return this.key;
  }
}
export function isOptionTicker(ticker: string): boolean {
  return ticker.length >= 16;
}

export function getPolygonTicker({
  assetClass,
  currencyCode,
  symbol,
}: Pick<
  SecurityAttributes,
  'assetClass' | 'currencyCode' | 'symbol'
>): PolygonTicker | null {
  if (!symbol) return null;

  switch (assetClass) {
    case ASSET_CLASS.options: {
      return new PolygonTicker('options', `O:${symbol}`);
    }
    case ASSET_CLASS.crypto: {
      return new PolygonTicker('crypto', `X:${symbol}${currencyCode}`);
    }
    case ASSET_CLASS.cash: {
      return symbol === currencyCode
        ? null // if the symbol matches the currencyCode then we're just dealing with a basic cash holding
        : new PolygonTicker('fx', `C:${symbol}${currencyCode}`);
    }
  }

  if (isOptionTicker(symbol)) {
    return new PolygonTicker('options', `O:${symbol}`);
  }

  return new PolygonTicker('stocks', symbol);
}
