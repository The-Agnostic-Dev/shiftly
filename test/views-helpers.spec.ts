import { registerHelpers } from '../src/views/helpers';

type HelperFn = (...args: unknown[]) => unknown;

function captureHelpers(): Record<string, HelperFn> {
  const helpers: Record<string, HelperFn> = {};
  const fakeHbs = {
    registerHelper(name: string, fn: HelperFn) {
      helpers[name] = fn;
    },
  };
  registerHelpers(fakeHbs as never);
  return helpers;
}

describe('dayName helper', () => {
  const helpers = captureHelpers();

  it('labels each date in a Monday-to-Sunday week with its own weekday', () => {
    const week: Array<[string, string]> = [
      ['2026-11-02', 'Mon'],
      ['2026-11-03', 'Tue'],
      ['2026-11-04', 'Wed'],
      ['2026-11-05', 'Thu'],
      ['2026-11-06', 'Fri'],
      ['2026-11-07', 'Sat'],
      ['2026-11-08', 'Sun'],
    ];
    for (const [date, expected] of week) {
      expect(helpers.dayName(date)).toBe(expected);
    }
  });
});
