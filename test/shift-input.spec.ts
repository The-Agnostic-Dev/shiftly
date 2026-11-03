import { BadRequestException } from '@nestjs/common';
import { parseShiftForm } from '../src/shifts/shift-input';

describe('parseShiftForm', () => {
  const valid = { staffId: '3', date: '2026-11-04', start: '11:00', end: '19:00', position: 'Waiter', note: ' Window tables ' };

  it('reads a filled-in form', () => {
    expect(parseShiftForm(valid)).toEqual({
      staffId: 3, date: '2026-11-04', start: '11:00', end: '19:00', position: 'Waiter', note: 'Window tables',
    });
  });

  it('treats an empty person as an open shift', () => {
    expect(parseShiftForm({ ...valid, staffId: '' }).staffId).toBeNull();
  });

  it('allows overnight shifts', () => {
    expect(parseShiftForm({ ...valid, start: '22:00', end: '06:00' }).end).toBe('06:00');
  });

  it.each([
    [{ date: '' }],
    [{ start: '7am' }],
    [{ end: '19:00', start: '19:00' }],
    [{ position: 'Dancer' }],
  ])('rejects %j', (change) => {
    expect(() => parseShiftForm({ ...valid, ...change })).toThrow(BadRequestException);
  });
});
