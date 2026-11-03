import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';

export const SESSION_COOKIE = 'shiftly_sid';

/** Attaches the logged-in user and any pending flash message to the request. */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly auth: AuthService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const session = this.auth.session(req.cookies?.[SESSION_COOKIE]);
    if (session) {
      req.session = session;
      req.user = this.auth.findUser(session.username);
      res.locals.currentUser = req.user;
      if (req.method === 'GET' && session.flash) {
        res.locals.flash = session.flash;
        delete session.flash;
      }
    }
    next();
  }
}
