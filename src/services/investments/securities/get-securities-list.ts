import { SecurityModel } from 'shared-types';
import { Op, literal, type Order } from 'sequelize';
import Securities from '@models/investments/Security.model';
import { withTransaction } from '@services/common';

export const loadSecuritiesList = withTransaction(
  async <T extends keyof SecurityModel>({
    attributes,
    query,
  }: { attributes?: T[]; query?: string } = {}): Promise<Pick<SecurityModel, T>[]> => {
    let where: Record<string, unknown> | undefined = undefined;
    let order: Order | undefined = undefined;

    if (query) {
      where = {
        [Op.or]: [{ name: { [Op.iLike]: `%${query}%` } }, { symbol: { [Op.iLike]: `%${query}%` } }],
      };
      order = [
        [
          literal(
            `CASE
            WHEN "symbol" = '${query}' THEN 1
            WHEN "name" = '${query}' THEN 2
            WHEN "symbol" ILIKE '${query}%' THEN 3
            WHEN "name" ILIKE '${query}%' THEN 4
            ELSE 5
          END`,
          ),
          'ASC',
        ],
        ['name', 'ASC'],
        ['symbol', 'ASC'],
      ];
    }

    const securities = (await Securities.findAll({
      where,
      order,
      attributes,
      raw: true,
    })) as unknown as Pick<SecurityModel, T>[];

    return securities;
  },
);
