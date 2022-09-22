import { ERROR_CODES } from 'shared-types';

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
    super(401, code, message);
  }
}

export class NotFoundError extends CustomError {
  constructor(code: string, message: string) {
    super(404, code, message);
  }
}

export class ConflictError extends CustomError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}

export class ValidationError extends CustomError {
  constructor(
    { code = ERROR_CODES.validationError, message, details }:
    { code?: string; message: string, details?: Record<string, unknown> }
  ) {
    super(422, code, message, details);
  }
}

export class UnexpectedError extends CustomError {
  constructor(code: string, message: string) {
    super(500, code, message);
  }
}
