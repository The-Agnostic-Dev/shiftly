import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { StoreService } from '../store/store.service';
import type { SessionData, User } from '../store/types';
import { verifyPassword } from './password';

/** Sessions live in memory; restarting the server logs everyone out. */
@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, SessionData>();

  constructor(private readonly store: StoreService) {}

  findUser(username: string): User | undefined {
    return this.store.db.users.find((u) => u.username === username);
  }

  login(username: string, password: string): string | null {
    const user = this.findUser(username.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    const sid = randomBytes(24).toString('base64url');
    this.sessions.set(sid, { username: user.username });
    return sid;
  }

  session(sid: string | undefined): SessionData | undefined {
    return sid ? this.sessions.get(sid) : undefined;
  }

  logout(sid: string | undefined): void {
    if (sid) this.sessions.delete(sid);
  }

  /** Where each kind of user lands after logging in. */
  homeFor(user: User): string {
    switch (user.role) {
      case 'staff':
        return '/my-shifts';
      case 'hr':
        return '/hours';
      default:
        return '/rota';
    }
  }
}
