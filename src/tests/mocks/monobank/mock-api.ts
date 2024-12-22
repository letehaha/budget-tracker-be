import { http, HttpResponse } from 'msw';
import type { ExternalMonobankTransactionResponse } from 'shared-types';
import { getMockedClientData } from './data';

export const VALID_MONOBANK_TOKEN = 'adsfad1234asd2';
export const INVALID_MONOBANK_TOKEN = '1212121212112';
export const MONOBANK_URLS_MOCK = Object.freeze({
  personalStatement: /personal\/statement/,
  clientInfo: /personal\/client-info/,
});

export const getMonobankTransactionsMock = (response: ExternalMonobankTransactionResponse[] = []) => {
  return http.get(MONOBANK_URLS_MOCK.personalStatement, () => {
    return HttpResponse.json(response);
  });
};

export const monobankHandlers = [
  http.get(MONOBANK_URLS_MOCK.clientInfo, ({ request }) => {
    const token = request.headers.get('X-Token');

    if (token === INVALID_MONOBANK_TOKEN) {
      return new HttpResponse(null, {
        status: 403,
        statusText: 'Forbidden',
      });
    }

    return HttpResponse.json(getMockedClientData());
  }),
  getMonobankTransactionsMock(),
];
