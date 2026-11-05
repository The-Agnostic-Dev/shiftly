import type hbsModule from 'hbs';
import { formatDayMonth, isoWeekday } from '../common/dates';
import { formatAmount, formatNaira } from '../common/money';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function registerHelpers(hbs: typeof hbsModule): void {
  hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  hbs.registerHelper('dayName', (date: string) => DAY_NAMES[isoWeekday(date) - 1]);
  hbs.registerHelper('dayMonth', (date: string) => formatDayMonth(date));
  hbs.registerHelper('naira', (amount: number) => formatNaira(amount));
  hbs.registerHelper('amount', (amount: number) => formatAmount(amount));
  hbs.registerHelper('initials', (name: string) =>
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  );
  hbs.registerHelper('statusLabel', (status: string) => {
    switch (status) {
      case 'pending':
        return 'Waiting for manager';
      case 'approved':
        return 'Approved';
      default:
        return 'Declined';
    }
  });
}
