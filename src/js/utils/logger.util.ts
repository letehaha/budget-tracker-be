import { createLogger, transports } from 'winston';

export const logger = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/combined.log',
      level: 'info',
    }),
    new transports.Console({
      level: 'info',
    }),
  ],
});
