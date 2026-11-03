import type { Request } from 'express';

export type FlashKind = 'success' | 'error' | 'info';

export interface Flash {
  kind: FlashKind;
  text: string;
}

/** Queue a one-off message for the next page this user opens. */
export function flash(req: Request, kind: FlashKind, text: string): void {
  if (req.session) req.session.flash = { kind, text };
}
