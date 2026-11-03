import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { User, UserRole } from '../store/types';

export const PUBLIC_KEY = 'shiftly:public';
export const ROLES_KEY = 'shiftly:roles';

/** Route needs no login. */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/** Route is limited to these kinds of user. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): User => {
  return ctx.switchToHttp().getRequest<Request>().user as User;
});
