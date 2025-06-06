import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  message: string;
  stack?: string;
}

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error(err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const response: ErrorResponse = {
    message: err.message || 'An unexpected error occurred',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
