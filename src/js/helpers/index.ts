const isExist = (v) => v !== undefined;
const removeUndefinedKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
  for (const key in obj) {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  }

  return obj
};

const toSystemFiat = value => Math.floor(value * 100)
const fromSystemFiat = value => value / 100

export {
  isExist,
  toSystemFiat,
  fromSystemFiat,
  removeUndefinedKeys,
};

export * from './sequelize';
