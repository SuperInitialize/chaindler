import { Handler, NextFunction, Request, Response } from 'express';

export class Chain {
  private middlewares: Handler[];

  constructor(...middlewares: Handler[]) {
    this.middlewares = middlewares;
  }

  public handle(handler: Handler | any): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        let isClosed = false;
        req.on('close', () => {
          isClosed = true;
        });
        for (const middleware of this.middlewares) {
          if (isClosed) {
            break;
          }
          await new Promise<void>((resolve, reject): void => {
            middleware(req, res, (error: any): void => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          });
        }
        if (!isClosed) {
          handler(req, res, next);
        }
      } catch (error) {
        next(error);
      }
    };
  }
}
