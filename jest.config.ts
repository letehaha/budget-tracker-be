/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

export default {
  preset: 'ts-jest',
  verbose: true,
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(unit|spec|e2e).[jt]s?(x)'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.ts"],
  moduleNameMapper: {
    'shared-types': '<rootDir>/shared-types',
    '@routes/(.*)': '<rootDir>/src/routes/$1',
    '@middlewares/(.*)': '<rootDir>/src/middlewares/$1',
    '@common/(.*)': '<rootDir>/src/common/$1',
    '@controllers/(.*)': '<rootDir>/src/controllers/$1',
    '@migrations/(.*)': '<rootDir>/src/migrations/$1',
    '@models/(.*)': '<rootDir>/src/models/$1',
    '@tests/(.*)': '<rootDir>/src/tests/$1',
    '@js/(.*)': '<rootDir>/src/js/$1',
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@root/(.*)': '<rootDir>/src/$1',
  },
};
