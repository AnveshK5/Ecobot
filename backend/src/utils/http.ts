export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (...args: Parameters<T>) => {
    const next = args[2] as (error?: unknown) => void;
    Promise.resolve(fn(...args)).catch(next);
  };
}
