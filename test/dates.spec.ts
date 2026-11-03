import { addDays, isIsoDate, isoWeekday, resolveWeek, todayInLagos, weekDates, weekStart } from '../src/common/dates';

describe('dates', () => {
  it('numbers weekdays Monday 1 to Sunday 7', () => {
    expect(isoWeekday('2026-11-02')).toBe(1);
    expect(isoWeekday('2026-11-07')).toBe(6);
    expect(isoWeekday('2026-11-08')).toBe(7);
  });

  it('starts weeks on Monday', () => {
    expect(weekStart('2026-11-02')).toBe('2026-11-02');
    expect(weekStart('2026-11-05')).toBe('2026-11-02');
    expect(weekStart('2026-11-08')).toBe('2026-11-02');
    expect(weekDates('2026-11-02')).toEqual([
      '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08',
    ]);
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('uses the Lagos date, not the server date', () => {
    expect(todayInLagos(new Date('2026-11-02T23:30:00Z'))).toBe('2026-11-03');
    expect(todayInLagos(new Date('2026-11-02T22:30:00Z'))).toBe('2026-11-02');
  });

  it('validates and resolves week parameters', () => {
    expect(isIsoDate('2026-11-02')).toBe(true);
    expect(isIsoDate('02/11/2026')).toBe(false);
    expect(resolveWeek('2026-11-06')).toBe('2026-11-02');
    expect(resolveWeek('nonsense', '2026-11-04')).toBe('2026-11-02');
  });
});
