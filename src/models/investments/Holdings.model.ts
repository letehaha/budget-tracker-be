import { HoldingModel } from 'shared-types';
import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import Account from '@models/Accounts.model';
import Security from '@models/investments/Security.model';

/**
 * The Holding model represents individual investments within an investment account.
 * It tracks the specific securities that an account holds, along with the quantity of each security.
 * The current market value of each holding is dynamically calculated using the quantity and
 * the current market prices from the SecurityPricing model. This model is crucial for maintaining
 * a detailed record of a user's investment portfolio. It enables tracking the performance and value
 * of individual investments over time through periodic updates of market prices and real-time
 * portfolio valuation. This facilitates comprehensive portfolio analysis and reporting, providing insights
 * into investment growth and asset allocation.
 *
 * Dynamic Value Calculation:
 * The market value of a security changes over time as its price fluctuates.
 * By referencing the SecurityPricing table, which stores historical and current
 * prices of securities, the application can dynamically calculate the current
 * value of each holding.
 *
 * Historical Performance:
 * To assess the performance of a holding over time, the application can compare
 * historical prices from the SecurityPricing table with the purchase price
 * (potentially stored in the Holding model as cost basis) and the current price.
 *
 * To be super simple, the association looks like that:
 * 1. Account has Holdings.
 * 2. Holding contains Security name, it's value based on prices, and quantity.
 * 3. InvestmentTransaction CRUDs Security inside Holding.
 *
 * **Notes:**
 * 1. No need to store averageCost because we can easily calculate it from by
 * using "costBasis / quantity" formula. That way we simply data storage and
 * always have up to date value
 */

@Table({
  timestamps: true,
  tableName: 'Holdings',
})
export default class Holding extends Model<HoldingModel> {
  @ForeignKey(() => Account)
  @Column
  accountId: number;

  @ForeignKey(() => Security)
  @Column
  securityId: number;

  /**
   * The `value` and `refValue` fields represent the current market value of the
   * specific holding.
   * This value is calculated based on the latest available market price of the
   * `security` multiplied by the quantity of the security held in the holding.
   * It reflects the present worth of the investment in the market. This field
   * is crucial for understanding the real-time monetary worth of the
   * investment and plays a key role in portfolio valuation, performance tracking,
   * and making informed investment decisions. The value is dynamic and can
   * fluctuate based on market conditions, requiring regular updates to ensure accuracy.
   *
   * Important:
   * It needs to be recalculated every n-time to reflect real value.
   */
  // string because of how Sequelize works with Decimal type. It's still Numeric
  // in the DB
  @Column({ type: DataType.DECIMAL(20, 10) })
  value: string;

  @Column({ type: DataType.DECIMAL(20, 10) })
  refValue: string;

  /**
   * The `quantity` field represents the total number of units or shares
   * of the specific security currently held in the investment account. This field is crucial
   * for determining the overall exposure or investment in that particular security. It is used
   * in calculating the total value of the holding by multiplying the quantity with the current
   * market price of the security.
   *
   * Changes in quantity are driven by investment transactions such as buying or
   * selling shares of the security.
   */
  @Column({ type: DataType.DECIMAL(36, 18) })
  quantity: string;

  /**
   * The `costBasis` field represents the original value or purchase price of an
   * investment in the Holding model.
   * It includes the price paid per unit of the security plus any associated
   * expenses like commissions or fees.
   * This field is vital for calculating capital gains or losses when the
   * investment is sold and for assessing the overall performance of the
   * investment. It also plays a crucial role in determining tax liabilities
   * related to capital gains. The cost basis can be adjusted for corporate
   * actions and other financial events.
   *
   * Example:
   * If an investor bought 100 shares of a company at $10 per share, and they paid
   * a $50 commission, their costBasis for this investment would be:
   * $1,050 (100 shares * $10 + $50 commission).
   *
   * Important:
   * It needs to be recalculated when there are new investment transactions that
   * affect the quantity or value of holding.
   */
  @Column({ type: DataType.DECIMAL(24, 10), allowNull: true })
  costBasis: string;
  @Column({ type: DataType.DECIMAL(24, 10), allowNull: true })
  refCostBasis: string;

  @Column({ type: DataType.STRING, defaultValue: 'USD' })
  currencyCode: string;

  /**
   * Indicates whether a particular holding should be excluded from certain
   * calculations, analyses, or reports within the application. This can be for
   * various reasons, depending on the specific needs or preferences of the user
   * or the application's functionality.
   */
  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  excluded: boolean;

  @BelongsTo(() => Account)
  account: Account;

  @BelongsTo(() => Security)
  security: Security;
}
