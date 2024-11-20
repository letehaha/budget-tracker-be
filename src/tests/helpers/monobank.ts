import { faker } from '@faker-js/faker';
import { subDays } from 'date-fns';
import { ExternalMonobankClientInfoResponse, ExternalMonobankTransactionResponse } from 'shared-types';
import * as helpers from '@tests/helpers';
import Transactions from '@models/Transactions.model';
import Accounts from '@models/Accounts.model';
import MockAdapter from 'axios-mock-adapter';

const getMockedClientData = (): ExternalMonobankClientInfoResponse => ({
  clientId: 'sdfsdfsdf',
  name: 'Test User',
  webHookUrl: '',
  permissions: '',
  accounts: [
    {
      id: 'test-account-1',
      sendId: 'test-send-id-1',
      balance: 2500000,
      creditLimit: 200000,
      type: 'black',
      currencyCode: 980,
      cashbackType: 'Miles',
      maskedPan: [],
      iban: 'test iban 1',
    },
    {
      id: 'test-account-2',
      sendId: 'test-send-id-2',
      balance: 1000,
      creditLimit: 0,
      type: 'black',
      currencyCode: 840,
      cashbackType: 'Miles',
      maskedPan: [],
      iban: 'test iban 2',
    },
  ],
  jars: [],
});

const getMockedTransactionData = (
  amount = 1,
  { initialBalance }: { initialBalance?: number } = {},
): ExternalMonobankTransactionResponse[] => {
  const currentDate = helpers.randomDate();
  // To make balance change realistic, we store initial one here and the sub below
  let initialAccountBalance = initialBalance ?? faker.number.int({ min: 10000, max: 9999999 });

  return new Array(amount).fill(0).map((_, index) => {
    const amount = faker.number.int({ min: 1000, max: 99999 });
    // Make expenses and incomes
    const realisticAmount = index % 3 ? amount : amount * -1;
    const newBalance = (initialAccountBalance = initialAccountBalance + realisticAmount);

    return {
      id: faker.string.uuid(),
      time: Math.abs(subDays(currentDate, index).getTime() / 1000),
      description: '',
      mcc: faker.number.int(300),
      originalMcc: faker.number.int(300),
      hold: false,
      amount: realisticAmount,
      operationAmount: faker.number.int(10000),
      currencyCode: faker.number.int({ min: 10, max: 999 }),
      commissionRate: 0,
      cashbackAmount: 0,
      balance: newBalance,
      comment: '',
      receiptId: '',
      invoiceId: '',
      counterEdrpou: '',
      counterIban: '',
      counterName: '',
    };
  });
};

const DUMB_MONOBANK_API_TOKEN = '234234234234';

const callPairMonobankUser = () => {
  return helpers.makeRequest({
    method: 'post',
    url: '/banks/monobank/pair-user',
    payload: {
      token: DUMB_MONOBANK_API_TOKEN,
    },
  });
};

const pairMonobankUser = (mock: MockAdapter) => {
  mock.onGet(/personal\/client-info/).reply(200, getMockedClientData());

  return callPairMonobankUser();
};

const getTransactions = async () => {
  return helpers.extractResponse(
    await helpers.makeRequest({
      method: 'get',
      url: '/transactions',
    }),
  );
};

const addTransactions = async (
  mock: MockAdapter,
  { amount = 10 }: { amount?: number } = {},
): Promise<{
  account: Accounts;
  transactions: Transactions[];
}> => {
  const accounts: Accounts[] = helpers.extractResponse(
    await helpers.makeRequest({
      method: 'get',
      url: '/accounts',
    }),
  );
  const account = accounts[1]!;

  const mockedTransactions = helpers.monobank.mockedTransactions(amount, {
    initialBalance: account.initialBalance,
  });

  mock.onGet(/personal\/statement/).reply(200, mockedTransactions);

  await helpers.makeRequest({
    method: 'get',
    url: '/banks/monobank/load-transactions',
    payload: {
      from: subDays(new Date(), 2).getTime(),
      to: new Date().getTime(),
      accountId: account.id,
    },
  });

  // Let server some time to process transactions
  await helpers.sleep(500);

  const transactions = await getTransactions();

  return { account, transactions };
};

export default {
  pair: pairMonobankUser,
  getTransactions,
  mockTransactions: addTransactions,
  callPair: callPairMonobankUser,
  mockedTransactions: getMockedTransactionData,
  mockedClientData: getMockedClientData,
  mockedToken: DUMB_MONOBANK_API_TOKEN,
};
