import { makeRequest } from './common';
import * as accountGroupService from '@root/services/account-groups';

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

export async function deleteAccountGroup<R extends boolean | undefined = undefined>({
  groupId,
  raw,
}: Omit<Parameters<typeof accountGroupService.deleteAccountGroup>[0], 'userId'> & {
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof accountGroupService.deleteAccountGroup>>, R>({
    method: 'delete',
    url: `/account-group/${groupId}`,
    raw,
  });
}

export async function addAccountToGroup<R extends boolean | undefined = undefined>({
  raw,
  accountId,
  groupId,
}: Parameters<typeof accountGroupService.addAccountToGroup>[0] & {
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof accountGroupService.addAccountToGroup>>, R>({
    method: 'post',
    url: `/account-group/${groupId}/add-account/${accountId}`,
    raw,
  });
}
