export class CustomError extends Error {
  public httpCode: number;
  public code: string;

  constructor(httpCode, code: string, message: string) {
    super(message);

    this.httpCode = httpCode
    this.code = code
  }
}

export class UnexpectedError extends CustomError {
  constructor(code: string, message: string) {
    super(500, code, message);
  }
}
