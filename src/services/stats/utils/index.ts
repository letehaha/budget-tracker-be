import { endOfDay } from "date-fns";
import { Op } from "sequelize";

interface DateQuery {
  // yyyy-mm-dd
  from?: string;
  // yyyy-mm-dd
  to?: string;
}

export const getWhereConditionForTime = ({ from, to }: DateQuery) => {
  const where: { time?: Record<symbol, Date[] | Date> } = {};

  if (from && to) {
    where.time = {
      [Op.between]: [new Date(from), endOfDay(new Date(to))],
    };
  } else if (from) {
    where.time = {
      [Op.gte]: new Date(from),
    };
  } else if (to) {
    where.time = {
      [Op.lte]: new Date(to),
    };
  }

  return where;
};
