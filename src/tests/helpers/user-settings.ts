import { makeRequest } from './common';
import { getUserSettings as apiGetUserSettings } from '@root/services/user-settings/get-user-settings';
import { updateUserSettings as apiUpdateUserSettings } from '@root/services/user-settings/update-settings';

export async function getUserSettings<R extends boolean | undefined = undefined>({ raw }: { raw?: R }) {
  return makeRequest<Awaited<ReturnType<typeof apiGetUserSettings>>, R>({
    method: 'get',
    url: '/user/settings',
    raw,
  });
}

export async function updateUserSettings<R extends boolean | undefined = undefined>({
  raw,
  ...payload
}: Omit<Parameters<typeof apiUpdateUserSettings>[0], 'userId'> & {
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof apiUpdateUserSettings>>, R>({
    method: 'put',
    url: '/user/settings',
    payload: payload.settings,
    raw,
  });
}
