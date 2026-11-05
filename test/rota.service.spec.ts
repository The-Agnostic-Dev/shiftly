import { RotaService } from '../src/rota/rota.service';
import { addDays, todayInLagos, weekStart } from '../src/common/dates';
import { memoryStore } from './helpers';

describe('RotaService', () => {
  const thisWeek = weekStart(todayInLagos());
  const nextWeek = addDays(thisWeek, 7);

  it('shows the before-midnight portion of an overnight shift on its start day', () => {
    const rota = new RotaService(memoryStore());
    const weekView = rota.week('lekki', thisWeek);
    const sunday = weekView.days.find((d) => d.date === addDays(thisWeek, 6))!;
    expect(sunday.chips).toContainEqual(
      expect.objectContaining({ staffId: 4, start: '22:00', end: '24:00', position: 'Kitchen porter' })
    );
  });

  it('shows the after-midnight portion on the next day and includes staff in headcount', () => {
    const rota = new RotaService(memoryStore());
    const nextWeekView = rota.week('lekki', nextWeek);
    const monday = nextWeekView.days.find((d) => d.date === nextWeek)!;
    expect(monday.chips).toContainEqual(
      expect.objectContaining({ staffId: 4, start: '00:00', end: '06:00', position: 'Kitchen porter' })
    );
    expect(monday.headcount).toContain(4);
  });

  it('sums only the segments that fall inside the displayed week', () => {
    const rota = new RotaService(memoryStore());
    const thisWeekView = rota.week('lekki', thisWeek);
    const chidiRow = thisWeekView.rows.find((r) => r.member.name === 'Chidi Okonkwo')!;
    expect(chidiRow.hours).toBe(34);

    const nextWeekView = rota.week('lekki', nextWeek);
    const chidiNextWeekRow = nextWeekView.rows.find((r) => r.member.name === 'Chidi Okonkwo')!;
    expect(chidiNextWeekRow.hours).toBe(40);
  });
});
