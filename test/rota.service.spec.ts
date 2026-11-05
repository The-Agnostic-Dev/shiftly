import { addDays, todayInLagos, weekStart } from '../src/common/dates';
import { RotaService } from '../src/rota/rota.service';
import { services } from './helpers';

describe('RotaService', () => {
  const week = weekStart(todayInLagos());
  const nextWeek = addDays(week, 7);

  function rota() {
    const { store, staff } = services();
    return new RotaService(store, staff);
  }

  it('shows the pre-midnight portion of a Sunday overnight shift under Sunday', () => {
    const grid = rota().week('lekki', week);
    const chidi = grid.rows.find((r) => r.member.name === 'Chidi Okonkwo')!;
    expect(chidi.cells[6].shifts).toContainEqual(expect.objectContaining({ start: '22:00', end: '24:00' }));
    expect(grid.days[6].staffOn).toContain(4);
  });

  it('shows the after-midnight portion under Monday of the next week', () => {
    const grid = rota().week('lekki', nextWeek);
    const chidi = grid.rows.find((r) => r.member.name === 'Chidi Okonkwo')!;
    expect(chidi.cells[0].shifts).toContainEqual(expect.objectContaining({ start: '00:00', end: '06:00' }));
    expect(grid.days[0].staffOn).toContain(4);
  });
});
