import { addDays, todayInLagos, weekStart } from '../src/common/dates';
import { RotaService } from '../src/rota/rota.service';
import { services } from './helpers';

describe('RotaService', () => {
  const week = weekStart(todayInLagos());
  const nextWeek = addDays(week, 7);

  function rota() {
    const { shifts, staff, availability } = services();
    return new RotaService(shifts, staff, availability);
  }

  it('shows the pre-midnight portion of a Sunday overnight shift under Sunday', () => {
    const grid = rota().week('lekki', week);
    const chidi = grid.rows.find((r) => r.name === 'Chidi Okonkwo')!;
    expect(chidi.cells[6].shifts).toContainEqual(expect.objectContaining({ start: '22:00', end: '24:00', overnight: true }));
    expect(grid.days[6].headcount).toBeGreaterThan(0);
  });

  it('shows the after-midnight portion under Monday of the next week', () => {
    const grid = rota().week('lekki', nextWeek);
    const chidi = grid.rows.find((r) => r.name === 'Chidi Okonkwo')!;
    expect(chidi.cells[0].shifts).toContainEqual(expect.objectContaining({ start: '00:00', end: '06:00', overnight: true }));
    expect(grid.days[0].headcount).toBeGreaterThan(0);
  });

  it('keeps a midnight-ending shift on its start day without a phantom next-day chip', () => {
    const grid = rota().week('ikeja', week);
    const obinna = grid.rows.find((r) => r.name === 'Obinna Uche')!;
    const thursday = obinna.cells[3];
    expect(thursday.shifts).toContainEqual(expect.objectContaining({ start: '16:00', end: '00:00', overnight: true }));
    expect(thursday.shifts).not.toContainEqual(expect.objectContaining({ start: '00:00', end: '00:00' }));
    expect(obinna.cells[4].shifts).not.toContainEqual(expect.objectContaining({ start: '00:00', end: '00:00' }));
    expect(grid.days[4].headcount).toBe(4);
    expect(grid.shiftCount).toBe(24);
  });
});
