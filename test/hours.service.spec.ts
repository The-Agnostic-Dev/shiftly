import { todayInLagos, weekStart } from '../src/common/dates';
import { services } from './helpers';

describe('HoursService', () => {
  const week = weekStart(todayInLagos());

  it('adds up hours and overtime for the week', () => {
    const { hours } = services();
    const tunde = hours.forWeek('lekki', week).rows.find((r) => r.member.name === 'Tunde Bakare')!;
    expect(tunde.shifts).toBe(6);
    expect(tunde.hours).toBe(48);
    expect(tunde.overtimeHours).toBe(8);
    expect(tunde.overtimePay).toBe(30000);
  });

  it('counts Chidi’s overnight shifts in his weekly hours', () => {
    const { hours } = services();
    const chidi = hours.forWeek('lekki', week).rows.find((r) => r.member.name === 'Chidi Okonkwo')!;
    expect(chidi.shifts).toBe(5);
    expect(chidi.hours).toBe(40);
    expect(chidi.overtimeHours).toBe(0);
    expect(chidi.overtimePay).toBe(0);
  });

  it('lists everyone in the branch, including people with no shifts', () => {
    const { hours, staff } = services();
    const rows = hours.forWeek('lekki', week).rows;
    expect(rows.map((r) => r.member.id).sort()).toEqual(staff.byBranch('lekki').map((m) => m.id).sort());
    const empty = hours.forWeek('lekki', '2020-01-06');
    expect(empty.totalHours).toBe(0);
  });

  it('picks up a newly added shift', async () => {
    const { hours, shifts } = services();
    const before = hours.forWeek('lekki', week).rows.find((r) => r.member.id === 6)!.hours;
    await shifts.create('lekki', { staffId: 6, date: week, start: '09:00', end: '13:00', position: 'Waiter', note: '' }, 'Test');
    const after = hours.forWeek('lekki', week).rows.find((r) => r.member.id === 6)!.hours;
    expect(after).toBe(before + 4);
  });
});
