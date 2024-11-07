import { makeRequest } from './common';
import * as accountGroupService from '@root/services/account-groups/account-groups.service';

export async function createAccountGroup<R extends boolean | undefined = undefined>({
  raw,
  ...payload
}: Omit<Parameters<typeof accountGroupService.createAccountGroup>[0], 'userId'> & {
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof accountGroupService.createAccountGroup>>, R>({
    method: 'post',
    url: '/account-group',
    payload,
    raw,
  });
}

export async function updateAccountGroup<R extends boolean | undefined = undefined>({
  raw,
  groupId,
  ...payload
}: Omit<Parameters<typeof accountGroupService.updateAccountGroup>[0], 'userId'> & {
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof accountGroupService.updateAccountGroup>>, R>({
    method: 'put',
    url: `/account-group/${groupId}`,
    payload,
    raw,
  });
}

export async function getAccountGroups<R extends boolean | undefined = undefined>({
  raw,
}: {
  raw?: R;
} = {}) {
  return makeRequest<Awaited<ReturnType<typeof accountGroupService.getAccountGroups>>, R>({
    method: 'get',
    url: '/account-group',
    raw,
  });
}
