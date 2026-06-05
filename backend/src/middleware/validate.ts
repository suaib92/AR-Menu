import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400);
        next(new Error(message));
      } else {
        next(error);
      }
    }
  };
};
