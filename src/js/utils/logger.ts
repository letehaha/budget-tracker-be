import winston, { format, transports } from 'winston';

const createWinstonLogger = () => {
  return winston.createLogger({
    level: 'info',
    format: format.combine(
      format.errors({ stack: true }),
      format.timestamp(),
      format.colorize(),
      format.printf(
        (mess) => `[${mess.timestamp}] ${mess.level}: ${mess.message}`
      ),
    ),
    transports: [
      //
      // - Write all logs with importance level of `error` or less to `error.log`
      // - Write all logs with importance level of `info` or less to `combined.log`
      //
      new transports.File({ filename: 'error.log', level: 'error' }),
      new transports.File({ filename: 'combined.log' }),
      new transports.Console(),
    ],
  });
};

const winstonLogger = createWinstonLogger();

const createLogger =
  (severity: 'info' | 'warn') =>
  (message: string, ...meta: Record<string, unknown>[]) => {
    winstonLogger.log(severity, message, ...meta);
  };

const formatErrorToString = (error: string | Error) => {
  let message = '';

  if (error instanceof Error) {
    // An error object is not 100% like a normal object, so
    // we have to jump through hoops to get needed info out
    // of error objects for logging.
    message = error.stack;
  } else {
    message = error;
  }

  return message
};

function loggerErrorHandler(message: string, ...extra: Record<string, unknown>[]): void;
function loggerErrorHandler(error: Error, ...extra: Record<string, unknown>[]): void;
function loggerErrorHandler(messageParam: { message: string, error?: Error } | string | Error, ...extra: Record<string, unknown>[]): void;
function loggerErrorHandler(messageParam: { message?: string, error: Error } | string | Error, ...extra: Record<string, unknown>[]): void;
function loggerErrorHandler(messageParam: { message?: string, error?: Error } | string | Error, ...extra: Record<string, unknown>[]): void {
  let messageReult = ''

  if (typeof messageParam === 'string') {
    messageReult = messageParam
  } else if (typeof messageParam === 'string' || messageParam instanceof Error) {
    messageReult = formatErrorToString(messageParam)
  } else {
    const { message, error } = messageParam

    if (message === undefined && error) {
      messageReult = formatErrorToString(error);
    } else if (message && error === undefined) {
      messageReult = message
    } else {
      messageReult = `${message} \n ${formatErrorToString(error)}`
    }
  }

  winstonLogger.error(messageReult, ...extra);
}

const logger = {
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: loggerErrorHandler,
};

export { logger };
