import { Request, Response, NextFunction } from 'express';

// Validation middleware
export const validator = (_schema: any) => {
  return (_req: Request, _res: Response, next: NextFunction) => {

    next();
  };
}; 