import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { SECURITY_PROVIDER, ASSET_CLASS, SecurityModel } from 'shared-types';
import Holding from '@models/investments/Holdings.model';
import InvestmentTransaction from '@models/investments/InvestmentTransaction.model';
import SecurityPricing from '@models/investments/SecurityPricing.model';

/**
 * Represents static information about financial securities, such as stocks, bonds, mutual funds, etc.
 * This table is designed to store immutable characteristics of securities and
 * does not include dynamic  data like current pricing or historical prices.
 * The absence of pricing data is deliberate to maintain a clear separation of
 * concerns, as pricing is subject to frequent changes and is best tracked in a
 * dedicated table for efficiency and accuracy.
 */
@Table({
  timestamps: true,
  tableName: 'Securities',
  indexes: [
    {
      unique: true,
      fields: ['symbol', 'exchangeMic'],
    },
  ],
})
export default class Security extends Model<SecurityModel> {
  @Column({
    unique: true,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  /**
   * The name of the security, typically the official name of the stock, bond,
   * or other financial instrument.
   */
  @Column({ allowNull: true })
  name: string;

  /**
   * The trading symbol or ticker associated with the security, used to uniquely
   * identify it on stock exchanges.
   */
  @Column({ allowNull: true })
  symbol: string;

  /**
   * The CUSIP number (Committee on Uniform Securities Identification Procedures) is a unique identifier
   * assigned to U.S. and Canadian securities for the purposes of facilitating clearing and settlement of trades.
   */
  @Column({ allowNull: true })
  cusip: string;

  /**
   * The ISIN number (International Securities Identification Number) is a unique code assigned to securities
   * internationally for uniform identification, which helps in reducing the risk of ambiguities in international trading.
   */
  @Column({ allowNull: true })
  isin: string;

  /**
   * (Applicable for derivative securities) The number of shares or units
   * represented by a single contract, commonly used in options and futures trading.
   */
  @Column({ type: DataType.DECIMAL(36, 18), allowNull: true })
  sharesPerContract: string;

  /**
   * The ISO currency code representing the currency in which the transactions
   * will be conducted. For cryptocurrencies, this code refers to
   * the specific currency linked to it (e.g., USD for BTC-USD, EUR for BTC-EUR).
   */
  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  currencyCode: string;

  /**
   * Crypto currency code for crypto securities. Since ticker represents not
   * just a crypto token, but an actual pair, we need to store symbol separately
   * (e.g., BTC for BTC-USD, BTC for BTC-EUR).
   */
  @Column({ type: DataType.STRING, allowNull: true })
  cryptoCurrencyCode: string;

  /**
   * The timestamp indicating the last time the pricing information for this
   * security was updated.
   */
  @Column({ type: DataType.DATE, allowNull: true })
  pricingLastSyncedAt: Date;

  /**
   * A flag indicating whether the security is considered as cash within a brokerage account.
   * This is often used for cash management in investment portfolios.
   */
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isBrokerageCash: boolean;

  /**
   * The acronym or shorthand for the exchange where this security is traded,
   * which provides an easy reference to identify the trading platform.
   *
   * Example:
   * NYSE –	New York Stock Exchange
   */
  @Column({ allowNull: true })
  exchangeAcronym: string;

  /**
   * The Market Identifier Code (MIC) as per ISO standard, representing the exchange where the security is traded.
   * MIC is a unique identification code used to identify securities trading exchanges and market platforms globally.
   * Read more: https://www.investopedia.com/terms/m/mic.asp
   */
  @Column({ allowNull: true })
  exchangeMic: string;

  /**
   * The full name of the exchange where the security is listed and traded.
   * This helps in clearly identifying the specific market platform.
   */
  @Column({ allowNull: true })
  exchangeName: string;

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
  @Column({
    type: DataType.ENUM(...Object.values(SECURITY_PROVIDER)),
    allowNull: false,
    defaultValue: SECURITY_PROVIDER.other,
  })
  providerName: SECURITY_PROVIDER;

  /**
   * The category of assets to which this security belongs.
   * Enumerated values represent different classes of assets such as stocks, bonds, etc.
   */
  @Column({
    type: DataType.ENUM(...Object.values(ASSET_CLASS)),
    allowNull: false,
    defaultValue: ASSET_CLASS.other,
  })
  assetClass: ASSET_CLASS;

  // Associations
  @HasMany(() => Holding)
  holdings: Holding[];

  @HasMany(() => InvestmentTransaction)
  investmentTransactions: InvestmentTransaction[];

  @HasMany(() => SecurityPricing)
  pricing: SecurityPricing[];
}
