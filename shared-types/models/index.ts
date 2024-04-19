import {
  ACCOUNT_TYPES,
  CATEGORY_TYPES,
  TRANSACTION_TYPES,
  PAYMENT_TYPES,
  TRANSACTION_TRANSFER_NATURE,
  ACCOUNT_CATEGORIES,
} from 'shared-types';
export * from './external-services';

export interface UserModel {
  id: number;
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  middleName: string;
  avatar: string;
  totalBalance: number;
  defaultCategoryId: number;
}

export interface CategoryModel {
  color: string;
  id: number;
  imageUrl: null | string;
  name: string;
  parentId: null | number;
  type: CATEGORY_TYPES;
  userId: number;
}

export interface AccountModel {
  type: ACCOUNT_TYPES;
  id: number;
  name: string;
  initialBalance: number;
  refInitialBalance: number;
  currentBalance: number;
  refCurrentBalance: number;
  creditLimit: number;
  refCreditLimit: number;
  accountCategory: ACCOUNT_CATEGORIES;
  currencyId: number;
  userId: number;
  externalId?: string;
  externalData?: object;
  isEnabled: boolean;
}

export interface MonobankUserModel {
  id: number;
  clientId: string;
  name: string;
  webHookUrl?: string;
  systemUserId: number;
  apiToken: string;
}

export interface BalanceModel {
  id: number;
  date: Date;
  amount: number;
  accountId: number;
  account: Omit<AccountModel, 'systemType'>;
}

export interface TransactionModel {
  id: number;
  amount: number;
  // Amount in base currency
  refAmount: number;
  note: string;
  time: Date;
  userId: number;
  transactionType: TRANSACTION_TYPES;
  paymentType: PAYMENT_TYPES;
  accountId: number;
  categoryId: number;
  currencyId: number;
  currencyCode: string;
  accountType: ACCOUNT_TYPES;
  refCurrencyCode: string;

  // is transaction transfer?
  transferNature: TRANSACTION_TRANSFER_NATURE;
  // (hash, used to connect two transactions)
  transferId: string;

  originalId: string; // Stores the original id from external source
  externalData: object; // JSON of any addition fields
  // balance: number;
  // hold: boolean;
  // receiptId: string;
  commissionRate: number; // should be comission calculated as refAmount
  refCommissionRate: number; // should be comission calculated as refAmount
  cashbackAmount: number; // add to unified
  refundLinked: boolean;
}

export interface CurrencyModel {
  id: number;
  currency: string;
  digits: number;
  number: number;
  code: string;
  isDisabled: boolean;
}

export interface UserCurrencyModel {
  id: number;
  userId: number;
  currencyId: number;
  exchangeRate: number;
  liveRateUpdate: boolean;
  isDefaultCurrency: boolean;
  currency?: CurrencyModel;
  user?: UserModel;
}

export interface ExchangeRatesModel {
  id: number;
  baseId: number;
  baseCode: string;
  quoteId: number;
  quoteCode: string;
  rate: number;
}

export interface UserExchangeRatesModel extends ExchangeRatesModel {
  userId: number;
  custom?: boolean;
}

export enum SECURITY_PROVIDER {
  polygon = 'polygon',
  other = 'other',
}

export enum ASSET_CLASS {
  cash = 'cash',
  crypto = 'crypto',
  fixed_income = 'fixed_income',
  options = 'options',
  stocks = 'stocks',
  other = 'other',
}

export interface SecurityModel {
  id: number;
  /**
   * The name of the security, typically the official name of the stock, bond,
   * or other financial instrument.
   */
  name?: string;

  /**
   * The trading symbol or ticker associated with the security, used to uniquely
   * identify it on stock exchanges.
   */
  symbol?: string;

  /**
   * The CUSIP number (Committee on Uniform Securities Identification Procedures) is a unique identifier
   * assigned to U.S. and Canadian securities for the purposes of facilitating clearing and settlement of trades.
   */
  cusip?: string;

  /**
   * The ISIN number (International Securities Identification Number) is a unique code assigned to securities
   * internationally for uniform identification, which helps in reducing the risk of ambiguities in international trading.
   */
  isin?: string;

  /**
   * (Applicable for derivative securities) The number of shares or units
   * represented by a single contract, commonly used in options and futures trading.
   */
  sharesPerContract?: string;

  /**
   * The ISO currency code representing the currency in which the transactions
   * will be conducted. For cryptocurrencies, this code refers to
   * the specific currency linked to it (e.g., USD for BTC-USD, EUR for BTC-EUR).
   */
  currencyCode: string;

  /**
   * Crypto currency code for crypto securities. Since ticker represents not
   * just a crypto token, but an actual pair, we need to store symbol separately
   * (e.g., BTC for BTC-USD, BTC for BTC-EUR).
   */
  cryptoCurrencyCode?: string;

  /**
   * The timestamp indicating the last time the pricing information for this
   * security was updated.
   */
  pricingLastSyncedAt?: Date;

  /**
   * A flag indicating whether the security is considered as cash within a brokerage account.
   * This is often used for cash management in investment portfolios.
   */
  isBrokerageCash: boolean;

  /**
   * The acronym or shorthand for the exchange where this security is traded,
   * which provides an easy reference to identify the trading platform.
   *
   * Example:
   * NYSE –	New York Stock Exchange
   */
  exchangeAcronym?: string;

  /**
   * The Market Identifier Code (MIC) as per ISO standard, representing the exchange where the security is traded.
   * MIC is a unique identification code used to identify securities trading exchanges and market platforms globally.
   * Read more: https://www.investopedia.com/terms/m/mic.asp
   */
  exchangeMic?: string;

  /**
   * The full name of the exchange where the security is listed and traded.
   * This helps in clearly identifying the specific market platform.
   */
  exchangeName?: string;

  /**
   * The name of the data provider or the source from which the security's information is obtained.
   * Enumerated values represent various recognized data providers.
   *
   * Useful for next cases:
   * 1. If more providers will be added and table will be expanded, by this field
   * we can identify provider-specific fields and features.
   * 2. Easy to refresh data when multiple providers exists.
   * 3. Service price, licensing, auditing, data source verification – help for
   * any legal cases
   */
  providerName: SECURITY_PROVIDER;

  /**
   * The category of assets to which this security belongs.
   * Enumerated values represent different classes of assets such as stocks, bonds, etc.
   */
  assetClass: ASSET_CLASS;
  createdAt: Date;
  updatedAt: Date;

  holdings?: HoldingModel[];
  investmentTransactions?: InvestmentTransactionModel[];
  pricing?: SecurityPricingModel[];
}

export interface HoldingModel {
  accountId: number;
  securityId: number;
  value: string;
  refValue: string;
  quantity: string;
  costBasis: string;
  refCostBasis: string;
  currencyCode: string;
  excluded: boolean;
  account?: AccountModel;
  security?: SecurityModel;
  createdAt: Date;
  updatedAt: Date;
}

export enum INVESTMENT_TRANSACTION_CATEGORY {
  buy = 'buy',
  sell = 'sell',
  dividend = 'dividend',
  transfer = 'transfer',
  tax = 'tax',
  fee = 'fee',
  cancel = 'cancel',
  other = 'other',
}

export interface InvestmentTransactionModel {
  id: number;
  /**
   * The identifier of the account associated with this transaction.
   * It links the transaction to a specific investment account.
   */
  accountId: number;
  securityId: number;
  transactionType: TRANSACTION_TYPES;
  date: string;
  /**
   * A descriptive name or title for the investment transaction, providing a
   * quick overview of the transaction's nature. Same as `note` in `Transactions`
   */
  name: string;
  /**
   * The monetary value involved in the transaction. Depending on the context,
   * this could represent the cost, sale proceeds, or other financial values
   * associated with the transaction. Basically quantity * price
   */
  amount: string;
  refAmount: string;

  fees: string;
  refFees: string;

  /**
   * * The quantity of the security involved in the transaction. This is crucial
   * for tracking the changes in holdings as a result of the transaction.
   */
  quantity: string;

  /**
   * The price per unit of the security at the time of the transaction.
   * This is used to calculate the total transaction amount and update the cost
   * basis of the holding.
   */
  price: string;
  refPrice: string;

  /**
   * The ISO currency code or standard cryptocurrency code representing the currency
   * in which the transaction was conducted. For cryptocurrencies, this code refers to
   * the specific cryptocurrency involved (e.g., BTC for Bitcoin, ETH for Ethereum).
   */
  currencyCode: string;
  /**
   * A category that classifies the nature of the investment transaction.
   * This could include types like 'buy', 'sell', 'dividend', 'interest', etc.,
   * providing a clear context for the transaction's purpose and impact on the investment portfolio.
   */
  category: INVESTMENT_TRANSACTION_CATEGORY;
  /**
   * "transferNature" and "transferId" are used to move funds between different
   * accounts and don't affect income/expense stats.
   */
  transferNature: TRANSACTION_TRANSFER_NATURE;
  // (hash, used to connect two transactions)
  transferId: string;
  updatedAt: Date;
  createdAt: Date;

  security?: SecurityModel;
  account?: AccountModel;
}

export interface SecurityPricingModel {
  securityId: number;
  /**
   * The date for which this pricing information is applicable. This field is crucial for tracking
   * the historical prices of securities and allows for analysis of price trends over time.
   * dd-mm-yyyy
   */
  date: Date;
  /**
   * The closing price of the security on the specified date. Closing prices are typically used in
   * financial analysis and reporting as they represent the final price at which the security was traded
   * during the trading session.
   */
  priceClose: string;
  /**
   * (Optional) The timestamp indicating the specific time the priceClose was recorded. This is particularly
   * useful when multiple price updates occur within a single day or for real-time price tracking.
   */
  priceAsOf: Date;
  /**
   * (Optional) A field indicating the source of the pricing information. This could be the name of the
   * data provider or the market/exchange from which the price was obtained. This field helps in
   * tracking the reliability and origin of the data.
   */
  source: string;

  updatedAt: Date;
  createdAt: Date;
  security?: SecurityModel;
}
