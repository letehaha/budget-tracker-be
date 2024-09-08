import { z } from 'zod';
import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as categoriesService from '@services/categories/edit-category';
import { errorHandler } from '../helpers';

export const editCategory = async (req, res: CustomResponse) => {
  const { id: userId } = req.user;
  const { id: categoryId } = req.params;
  const { name, imageUrl, color }: UpdateCategoryPayload = req.validated.body;

  try {
    const data = await categoriesService.editCategory({
      categoryId,
      userId,
      name,
      imageUrl,
      color,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

export const UpdateCategoryPayloadSchema = z
  .object({
    name: z.string().min(1).max(200, 'The name must not exceed 200 characters').optional(),
    imageUrl: z.string().url().max(500, 'The URL must not exceed 500 characters').optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i)
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });

const paramsZodSchema = z.object({
  id: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'ID must be a valid number',
  }),
});

export const updateCategorySchema = z.object({
  body: UpdateCategoryPayloadSchema,
  params: paramsZodSchema,
});

export type UpdateCategoryPayload = z.infer<typeof UpdateCategoryPayloadSchema>;
