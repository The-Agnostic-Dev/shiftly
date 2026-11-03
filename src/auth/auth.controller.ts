import { Body, Controller, Get, Post, Render, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators';
import { SESSION_COOKIE } from './session.middleware';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('login')
  @Render('login')
  loginPage() {
    return { title: 'Log in', bare: true };
  }

  @Public()
  @Post('login')
  login(@Body() body: { username?: string; password?: string }, @Res() res: Response) {
    const sid = this.auth.login(body.username ?? '', body.password ?? '');
    if (!sid) {
      return res.status(401).render('login', {
        title: 'Log in',
        bare: true,
        username: body.username,
        error: 'That username and password do not match.',
      });
    }
    const user = this.auth.findUser(this.auth.session(sid)!.username)!;
    res.cookie(SESSION_COOKIE, sid, { httpOnly: true, sameSite: 'lax', maxAge: 12 * 3_600_000 });
    return res.redirect(this.auth.homeFor(user));
  }

  @Public()
  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    this.auth.logout(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE);
    return res.redirect('/login');
  }
}
