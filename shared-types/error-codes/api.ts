export enum ERROR_CODES {
  // general
  tooManyRequests = 'TOO_MANY_REQUESTS',
  notFound = 'NOT_FOUND',
  unexpected = 'UNEXPECTED',
  validationError = 'VALIDATION_ERROR',
  forbidden = 'FORBIDDEN',

  // auth
  unauthorized = 'UNAUTHENTICATED',
  invalidCredentials = 'INVALID_CREDENTIALS',
  userExists = 'USER_ALREADY_EXISTS',

  // monobank
  monobankUserNotPaired = 'MONOBANK_USER_NOT_PAIRED',
  monobankUserAlreadyConnected = 'MONOBANK_USER_ALREADY_CONNECTED',
  monobankUserNotExist = 'MONOBANK_USER_NOT_EXIST',
  monobankTokenInvalid = 'MONOBANK_USER_TOKEN_INVALID',

  // transactions service
  txServiceUpdateBalance = 'CANNOT_UPDATE_BALANCE',

  // crypto/binance
  cryptoBinanceBothAPIKeysDoesNotexist = 10101,
  cryptoBinancePublicAPIKeyNotDefined = 10102,
  cryptoBinanceSecretAPIKeyNotDefined = 10103,
}
