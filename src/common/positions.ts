export const POSITIONS = [
  'Head chef',
  'Sous chef',
  'Line cook',
  'Kitchen porter',
  'Waiter',
  'Cashier',
  'Barman',
  'Supervisor',
] as const;

export type Position = (typeof POSITIONS)[number];

export function isPosition(value: unknown): value is Position {
  return typeof value === 'string' && (POSITIONS as readonly string[]).includes(value);
}
