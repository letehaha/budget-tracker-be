import { UnwrapPromise, UnwrapArray } from '@common/types';
import { requestsUtils, logger } from '@js/utils';
import type { IRestClient } from '@polygon.io/client-js';
import { restClient } from '@polygon.io/client-js';

type ITickersResults = UnwrapArray<
  UnwrapPromise<
    ReturnType<ReturnType<typeof restClient>['reference']['tickers']>
  >['results']
>;

type TickersResponse = (ITickersResults & {
  exchangeAcronym: string;
  exchangeMic: string;
  exchangeName: string;
})[];

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
}

export const marketDataService = new PolygonMarketDataService(
  process.env.POLYGON_API_KEY,
);
