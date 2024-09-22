import { z } from 'zod';
import cc from 'currency-codes';
import { API_RESPONSE_STATUS } from 'shared-types';
import { CustomResponse } from '@common/types';
import * as userExchangeRates from '@services/user-exchange-rate';
import { errorHandler } from '@controllers/helpers';

export const editCurrencyExchangeRate = async (req, res: CustomResponse) => {
  try {
    const { id: userId } = req.user;
    const { pairs }: EditCurrencyExchangeRateParams = req.validated.body;

    const data = await userExchangeRates.editUserExchangeRates({
      userId,
      pairs,
    });

    return res.status(200).json({
      status: API_RESPONSE_STATUS.success,
      response: data,
    });
  } catch (err) {
    errorHandler(res, err);
  }
};

const isValidCurrencyCode = (code: string) => cc.code(code) !== undefined;

const CurrencyCodeSchema = z.string().refine(
  (code) => isValidCurrencyCode(code),
  (code) => ({ message: `Invalid currency code: ${code}. Use ISO 4217 Code. For example: USD` }),
);

const UpdateExchangeRatePairSchema = z
  .object({
    baseCode: CurrencyCodeSchema,
    quoteCode: CurrencyCodeSchema,
    rate: z.number().positive(),
  })
  .strict();

const bodyZodSchema = z
  .object({
    pairs: z
      .array(UpdateExchangeRatePairSchema)
      .nonempty()
      .refine(
        (pairs) => pairs.every((pair) => pair.baseCode !== pair.quoteCode),
        'You cannot edit pair with the same base and quote currency code.',
      )
      .refine(
        (pairs) => pairs.every((pair) => pairs.some((item) => item.baseCode === pair.quoteCode)),
        "When changing base-quote pair rate, you need to also change opposite pair's rate.",
      ),
  })
  .strict();

type EditCurrencyExchangeRateParams = z.infer<typeof bodyZodSchema>;

export const editCurrencyExchangeRateSchema = z.object({
  body: bodyZodSchema,
});
