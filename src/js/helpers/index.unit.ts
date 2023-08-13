import { removeUndefinedKeys } from '@js/helpers';

describe('helpers tests', () => {
  describe('removeUndefinedKeys', () => {
    test.each([
      [{ id: 1, test: undefined }, { id: 1 }],
      [{ id: 1, test: 'test' }, { id: 1, test: 'test' }],
      [{ id: 1, test: NaN }, { id: 1 }],
      [{ id: 1, test: new Date(undefined) }, { id: 1 }],
    ])('%s to be %s', (value, expected) => {
      expect(removeUndefinedKeys(value)).toStrictEqual(expected);
    });
  })
});
