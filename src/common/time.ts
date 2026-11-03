/**
 * Shift times are "HH:MM" on the 24 hour clock. A shift whose end is at or
 * before its start runs past midnight (an overnight shift) and belongs to
 * the day it starts.
 */
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DAY_MINUTES = 24 * 60;

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && HH_MM.test(value);
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isOvernight(start: string, end: string): boolean {
  return toMinutes(end) <= toMinutes(start);
}

/** Length of a shift in minutes, overnight shifts included. */
export function shiftMinutes(start: string, end: string): number {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return e > s ? e - s : e + DAY_MINUTES - s;
}

interface Span {
  start: string;
  end: string;
}

/** Do two shifts on the same date overlap? */
export function overlaps(a: Span, b: Span): boolean {
  const aStart = toMinutes(a.start);
  const bStart = toMinutes(b.start);
  const aEnd = aStart + shiftMinutes(a.start, a.end);
  const bEnd = bStart + shiftMinutes(b.start, b.end);
  return aStart < bEnd && bStart < aEnd;
}

/** 480 -> "8", 570 -> "9.5", 285 -> "4.75" */
export function formatHours(minutes: number): string {
  return String(Math.round((minutes / 60) * 100) / 100);
}
