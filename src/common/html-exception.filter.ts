import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { flash } from './flash';

/**
 * Turns errors into pages a person can act on: logged-out users go to the
 * login page, rejected form posts go back where they came from with the
 * reason shown at the top, anything else gets the error page.
 */
@Catch()
export class HtmlExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    if (exception instanceof UnauthorizedException) return res.redirect('/login');

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? messageOf(exception) : 'Something went wrong on our side.';
    if (status >= 500) console.error(exception);

    if (req.method === 'POST' && (status === HttpStatus.BAD_REQUEST || status === HttpStatus.CONFLICT)) {
      flash(req, 'error', message);
      return res.redirect(303, req.get('referer') ?? '/');
    }
    return res.status(status).render('error', { title: 'Something went wrong', status, message });
  }
}

function messageOf(exception: HttpException): string {
  const body = exception.getResponse();
  if (typeof body === 'string') return body;
  const message = (body as { message?: string | string[] }).message;
  return Array.isArray(message) ? message.join(' ') : (message ?? exception.message);
}
