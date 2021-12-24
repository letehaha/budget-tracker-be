const { createLogger, transports } = require('winston');

const logger = createLogger({
  transports: [
    new transports.File({
      filename: 'logs/combined.log',
      level: 'info',
      exitOnError: false,
    }),
    new transports.Console({
      level: 'info',
    }),
  ],
});

exports.logger = logger;
