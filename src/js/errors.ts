export class CustomError extends Error {
  public httpCode: number;
  public code: string;

  constructor(httpCode, code: string, message: string) {
    super(message);

    this.httpCode = httpCode
    this.code = code
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

export class UnexpectedError extends CustomError {
  constructor(code: string, message: string) {
    super(500, code, message);
  }
}
