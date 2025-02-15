import dotenv from 'dotenv';
import 'module-alias/register';
import { createClient } from '@redis/client';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
import config from 'config';

import { logger } from '@js/utils/logger';

export const redisClient = createClient({
  socket: {
    host: config.get('redis.host'),
    connectTimeout: 5000,
  },
});

redisClient
  .connect()
  .then(() => {
    console.log('App connected to Redis! Took: ');
    console.timeEnd('connect-to-redis');
  })
  .catch((err) => {
    console.error('Cannot connect to Redis!', err);
  });

redisClient.on('error', (error: Error) => {
  logger.error({ message: 'Redis Client Error', error });
});
