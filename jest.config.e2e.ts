import baseConfig from './jest.config.base';

console.log('❗ RUNNING INTEGRATION TESTS');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  ...baseConfig,
  testMatch: ['<rootDir>/src/**/?(*.)+(e2e).[jt]s?(x)'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupIntegrationTests.ts'],
};
