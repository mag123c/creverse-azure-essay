export abstract class BaseException extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly extra?: Record<string, any>,
    public readonly logLevel: 'warn' | 'error' = 'error',
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      result: 'failed',
      message: this.message,
    };
  }
}
