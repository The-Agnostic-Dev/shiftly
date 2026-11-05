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
    expect(chidi.cells[6].shifts).toContainEqual(expect.objectContaining({ start: '22:00', end: '24:00' }));
    expect(grid.days[6].headcount).toBeGreaterThan(0);
  });

  it('shows the after-midnight portion under Monday of the next week', () => {
    const grid = rota().week('lekki', nextWeek);
    const chidi = grid.rows.find((r) => r.name === 'Chidi Okonkwo')!;
    expect(chidi.cells[0].shifts).toContainEqual(expect.objectContaining({ start: '00:00', end: '06:00' }));
    expect(grid.days[0].headcount).toBeGreaterThan(0);
  });
});
