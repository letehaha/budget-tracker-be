const isExist = (v) => v !== undefined;
const removeUndefinedKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
  for (const key in obj) {
    if (obj[key] === undefined) {
      delete obj[key]
    }
  }

  return obj
};

export {
  isExist,
  removeUndefinedKeys,
};
