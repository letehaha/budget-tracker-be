import { API_ERROR_CODES } from 'shared-types';

export enum ERROR_CODES {
  Unauthorized = 401,
  NotFoundError = 404,
  ConflictError = 409,
  ValidationError = 422,
  TooManyRequests = 429,
  UnexpectedError = 500,
}

export class CustomError extends Error {
  public httpCode: number;
  public code: string;
  public details: Record<string, unknown>;

  constructor(
    httpCode,
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);

    this.httpCode = httpCode
    this.code = code
    this.details = details
  }
}

export class Unauthorized extends CustomError {
  constructor(code: string, message: string) {
    super(ERROR_CODES.Unauthorized, code, message);
  }
}

export class NotFoundError extends CustomError {
  constructor(code: string, message: string) {
    super(ERROR_CODES.NotFoundError, code, message);
  }
}

export class ConflictError extends CustomError {
  constructor(code: string, message: string) {
    super(ERROR_CODES.ConflictError, code, message);
  }
}

export class ValidationError extends CustomError {
  constructor(
    { code = API_ERROR_CODES.validationError, message, details }:
    { code?: string; message: string, details?: Record<string, unknown> }
  ) {
    super(ERROR_CODES.ValidationError, code, message, details);
  }
}

export class UnexpectedError extends CustomError {
  constructor(code: string, message: string) {
    super(ERROR_CODES.UnexpectedError, code, message);
  }
}

export class TooManyRequests extends CustomError {
  constructor(code: string, message: string) {
    super(ERROR_CODES.TooManyRequests, code, message);
  }
}
