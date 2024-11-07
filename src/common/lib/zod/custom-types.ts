import { z } from 'zod';

export const recordId = () => z.coerce.number().int().positive().finite();
