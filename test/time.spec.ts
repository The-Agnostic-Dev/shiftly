import { formatHours, isOvernight, isTime, overlaps, shiftMinutes, splitShift } from '../src/common/time';

describe('shift times', () => {
  it('accepts 24 hour times only', () => {
    expect(isTime('09:00')).toBe(true);
    expect(isTime('23:59')).toBe(true);
    expect(isTime('24:00')).toBe(false);
    expect(isTime('9:00')).toBe(false);
  });

  it('measures day and overnight shifts', () => {
    expect(shiftMinutes('09:00', '17:00')).toBe(480);
    expect(shiftMinutes('22:00', '06:00')).toBe(480);
    expect(shiftMinutes('16:00', '00:00')).toBe(480);
    expect(isOvernight('22:00', '06:00')).toBe(true);
    expect(isOvernight('09:00', '17:00')).toBe(false);
  });

  it('detects overlapping shifts on the same day', () => {
    expect(overlaps({ start: '10:00', end: '18:00' }, { start: '17:00', end: '22:00' })).toBe(true);
    expect(overlaps({ start: '10:00', end: '18:00' }, { start: '18:00', end: '22:00' })).toBe(false);
    expect(overlaps({ start: '22:00', end: '06:00' }, { start: '23:00', end: '23:30' })).toBe(true);
  });

  it('splits overnight shifts at midnight', () => {
    expect(splitShift('09:00', '17:00')).toEqual([{ dayOffset: 0, minutes: 480 }]);
    expect(splitShift('22:00', '06:00')).toEqual([
      { dayOffset: 0, minutes: 120 },
      { dayOffset: 1, minutes: 360 },
    ]);
    expect(splitShift('16:00', '00:00')).toEqual([{ dayOffset: 0, minutes: 480 }]);
  });

  it('formats hours without trailing zeros', () => {
    expect(formatHours(480)).toBe('8');
    expect(formatHours(570)).toBe('9.5');
    expect(formatHours(285)).toBe('4.75');
  });
});
