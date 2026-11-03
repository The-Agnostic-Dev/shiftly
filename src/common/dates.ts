/**
 * Calendar helpers. Dates travel through the app as plain `YYYY-MM-DD`
 * strings (a branch's working day), so all arithmetic is done in UTC to
 * avoid the host machine's own time zone leaking in.
 */
export const TIME_ZONE = 'Africa/Lagos';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const lagosDate = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });
const lagosDateTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(toUtc(value).getTime());
}

/** Today's date in Lagos, whatever the server clock is set to. */
export function todayInLagos(now: Date = new Date()): string {
  return lagosDate.format(now);
}

export function addDays(date: string, days: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 1 = Monday ... 7 = Sunday */
export function isoWeekday(date: string): number {
  const day = toUtc(date).getUTCDay();
  return day === 0 ? 7 : day;
}

/** The Monday on or before `date`. Rota weeks run Monday to Sunday. */
export function weekStart(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

export function weekDates(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** "2 Nov 2026" */
export function formatDate(date: string): string {
  const d = toUtc(date);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** "2 Nov" */
export function formatDayMonth(date: string): string {
  return toUtc(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** "2 Nov, 14:05" in Lagos time, for timestamps. */
export function formatDateTime(iso: string): string {
  return lagosDateTime.format(new Date(iso));
}

export function resolveWeek(raw: unknown, today = todayInLagos()): string {
  return weekStart(isIsoDate(raw) ? raw : today);
}
