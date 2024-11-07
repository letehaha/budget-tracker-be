import { makeRequest } from '../common';
import { checkSecuritiesSyncingStatus } from '@root/services/investments/securities/sync-securities';
import { loadSecuritiesList } from '@root/services/investments/securities/get-securities-list';

export function syncSecuritiesData<R extends boolean | undefined = undefined>({
  raw,
}: {
  raw?: R;
} = {}) {
  return makeRequest<Awaited<void>, R>({
    method: 'get',
    url: '/investing/securities/sync',
    raw,
  });
}

export function getSyncSecuritiesStatus<R extends boolean | undefined = undefined>({
  raw,
}: {
  raw?: R;
} = {}) {
  return makeRequest<Awaited<ReturnType<typeof checkSecuritiesSyncingStatus>>, R>({
    method: 'get',
    url: '/investing/securities/sync-status',
    raw,
  });
}

export function getSecuritiesList<R extends boolean | undefined = undefined>({
  raw,
}: {
  raw?: R;
} = {}) {
  return makeRequest<Awaited<ReturnType<typeof loadSecuritiesList>>, R>({
    method: 'get',
    url: '/investing/securities',
    raw,
  });
}
