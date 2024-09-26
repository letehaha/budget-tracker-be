import { API_ERROR_CODES } from 'shared-types';

export enum ERROR_CODES {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFoundError = 404,
  ConflictError = 409,
  ValidationError = 422,
  Locked = 423,
  TooManyRequests = 429,
  UnexpectedError = 500,
}

export class CustomError extends Error {
  public httpCode: number;
  public code: API_ERROR_CODES;
  public details: Record<string, unknown> | undefined;

  constructor(httpCode, code: API_ERROR_CODES, message: string, details?: Record<string, unknown>) {
    super(message);

    this.httpCode = httpCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends CustomError {
  constructor({
    code = API_ERROR_CODES.BadRequest,
    message,
  }: {
    code?: API_ERROR_CODES;
    message: string;
  }) {
    super(ERROR_CODES.BadRequest, code, message);
  }
}

export class Unauthorized extends CustomError {
  constructor({
    code = API_ERROR_CODES.unauthorized,
    message,
  }: {
    code?: API_ERROR_CODES;
    message: string;
  }) {
    super(ERROR_CODES.Unauthorized, code, message);
  }
}

export class NotFoundError extends CustomError {
  constructor({
    code = API_ERROR_CODES.notFound,
    message,
  }: {
    code?: API_ERROR_CODES;
    message: string;
  }) {
    super(ERROR_CODES.NotFoundError, code, message);
  }
}

export class ConflictError extends CustomError {
  constructor({
    code = API_ERROR_CODES.conflict,
    message,
    details,
  }: {
    code?: API_ERROR_CODES;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(ERROR_CODES.ConflictError, code, message, details);
  }
}

export class ValidationError extends CustomError {
  constructor({
    code = API_ERROR_CODES.validationError,
    message,
    details,
  }: {
    code?: API_ERROR_CODES;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(ERROR_CODES.ValidationError, code, message, details);
  }
}

export class ForbiddenError extends CustomError {
  constructor({
    code = API_ERROR_CODES.forbidden,
    message,
    details,
  }: {
    code?: API_ERROR_CODES;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(ERROR_CODES.Forbidden, code, message, details);
  }
}

export class UnexpectedError extends CustomError {
  constructor(code: API_ERROR_CODES, message: string) {
    super(ERROR_CODES.UnexpectedError, code, message);
  }
}

export class TooManyRequests extends CustomError {
  constructor(code: API_ERROR_CODES, message: string) {
    super(ERROR_CODES.TooManyRequests, code, message);
  }
}

export class LockedError extends CustomError {
  constructor({
    code = API_ERROR_CODES.locked,
    message,
    details,
  }: {
    code?: API_ERROR_CODES;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(ERROR_CODES.Locked, code, message, details);
  }
}
