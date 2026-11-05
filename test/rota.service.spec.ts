import { addDays, todayInLagos, weekStart } from '../src/common/dates';
import { services } from './helpers';

describe('RotaService', () => {
  const thisWeek = weekStart(todayInLagos());
  const nextWeek = addDays(thisWeek, 7);

  it('shows the before-midnight portion of an overnight shift on its start day', () => {
    const rota = (services() as any).rota;
    const weekView = rota.week('lekki', thisWeek);
    const sunday = weekView.days.find((d) => d.date === addDays(thisWeek, 6))!;
    const chidiRow = weekView.rows.find((r) => r.name === 'Chidi Okonkwo')!;
    const sundayCell = chidiRow.cells.find((c) => c.date === sunday.date)!;
    expect(sundayCell.shifts).toContainEqual(
      expect.objectContaining({ staffId: 4, start: '22:00', end: '24:00', position: 'Kitchen porter' })
    );
  });

  it('shows the after-midnight portion on the next day and includes staff in headcount', () => {
    const rota = (services() as any).rota;
    const nextWeekView = rota.week('lekki', nextWeek);
    const monday = nextWeekView.days.find((d) => d.date === nextWeek)!;
    const chidiRow = nextWeekView.rows.find((r) => r.name === 'Chidi Okonkwo')!;
    const mondayCell = chidiRow.cells.find((c) => c.date === monday.date)!;
    expect(mondayCell.shifts).toContainEqual(
      expect.objectContaining({ staffId: 4, start: '00:00', end: '06:00', position: 'Kitchen porter' })
    );
    expect(monday.headcount).toBeGreaterThan(0);
  });

  it('sums only the segments that fall inside the displayed week', () => {
    const rota = (services() as any).rota;
    const thisWeekView = rota.week('lekki', thisWeek);
    const chidiRow = thisWeekView.rows.find((r) => r.name === 'Chidi Okonkwo')!;
    expect(chidiRow.hours).toBe(34);

    const nextWeekView = rota.week('lekki', nextWeek);
    const chidiNextWeekRow = nextWeekView.rows.find((r) => r.name === 'Chidi Okonkwo')!;
    expect(chidiNextWeekRow.hours).toBe(40);
  });
});
