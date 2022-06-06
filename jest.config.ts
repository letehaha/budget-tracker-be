/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    }
  },
  moduleNameMapper: {
    'shared-types': '<rootDir>/shared-types',
    '@routes/(.*)': '<rootDir>/src/routes/$1',
    '@middlewares/(.*)': '<rootDir>/src/middlewares/$1',
    '@models/(.*)': '<rootDir>/src/models/$1',
    '@js/(.*)': '<rootDir>/src/js/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
  },
};
