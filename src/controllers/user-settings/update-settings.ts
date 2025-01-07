import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as userSettingsService from '@services/user-settings/update-settings';
import { errorHandler } from '../helpers';
import { ZodSettingsSchema, SettingsSchema } from '@models/UserSettings.model';

export const updateUserSettingsSchema = z.object({
  body: ZodSettingsSchema,
});

export const updateUserSettings = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const settings: SettingsSchema = req.validated.body;
    const result = await userSettingsService.updateUserSettings({ userId, settings });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: result,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};
