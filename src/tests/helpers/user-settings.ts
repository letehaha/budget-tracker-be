import { makeRequest } from './common';
import { getUserSettings as apiGetUserSettings } from '@root/services/user-settings/get-user-settings';
import { updateUserSettings as apiUpdateUserSettings } from '@root/services/user-settings/update-settings';
import { editExcludedCategories as apiEditExcludedCategories } from '@root/services/user-settings/edit-excluded-categories';

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

export async function editExcludedCategories<R extends boolean | undefined = undefined>({
  raw,
  ...payload
}: Omit<Parameters<typeof apiEditExcludedCategories>[0], 'userId'> & {
  raw?: R;
}) {
  return makeRequest<Awaited<ReturnType<typeof apiEditExcludedCategories>>, R>({
    method: 'post',
    url: '/settings/edit-exclude-categories',
    payload,
    raw,
  });
}