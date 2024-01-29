import {
  Table,
  Column,
  Model,
  ForeignKey,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';
import Security from '@models/investments/Security.model';

/**
 * Represents the dynamic pricing information of financial securities over time.
 * This table is specifically designed to store time-sensitive data like daily
 * closing prices, and it complements the static data  stored in the Security
 * table. By segregating pricing data from the Security table, the design ensures
 * efficient handling of frequently changing market data, which is crucial for
 * accurate and up-to-date financial analysis and reporting.
 */
@Table({
  timestamps: true,
  tableName: 'SecurityPricings',
  // indexes: [{ fields: ['securityId', 'date'], unique: true, primaryKey: true }],
})
export default class SecurityPricing extends Model {
  @ForeignKey(() => Security)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  securityId: number;

  /**
   * The date for which this pricing information is applicable. This field is crucial for tracking
   * the historical prices of securities and allows for analysis of price trends over time.
   */
  @Column({
    type: DataType.DATEONLY,
    primaryKey: true,
  })
  date: string;

  /**
   * The closing price of the security on the specified date. Closing prices are typically used in
   * financial analysis and reporting as they represent the final price at which the security was traded
   * during the trading session.
   */
  @Column({ type: DataType.DECIMAL(20, 10) })
  priceClose: string;

  /**
   * (Optional) The timestamp indicating the specific time the priceClose was recorded. This is particularly
   * useful when multiple price updates occur within a single day or for real-time price tracking.
   */
  @Column({ type: DataType.DATE, allowNull: true })
  priceAsOf: Date;

  /**
   * (Optional) A field indicating the source of the pricing information. This could be the name of the
   * data provider or the market/exchange from which the price was obtained. This field helps in
   * tracking the reliability and origin of the data.
   */
  @Column({ allowNull: true })
  source: string;

  @BelongsTo(() => Security)
  security: Security;
}
