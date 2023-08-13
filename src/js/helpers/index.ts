const isExist = (v) => v !== undefined;
const removeUndefinedKeys = <T>(obj: T): T => {
  for (const key in obj) {
    if (
      obj[key] === undefined
      || (typeof obj[key] === 'number' && isNaN(obj[key] as number))
      // Test for Invalid Date object
      || (obj[key] instanceof Date && isNaN(obj[key] as number))
    ) {
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
