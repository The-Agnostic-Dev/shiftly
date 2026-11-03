import { Injectable } from '@nestjs/common';
import { addDays } from '../common/dates';
import { OVERTIME_MULTIPLIER, roundKobo, STANDARD_WEEK_HOURS } from '../common/money';
import { RotaEvents } from '../common/rota-events';
import { toMinutes } from '../common/time';
import { StaffService } from '../staff/staff.service';
import { StoreService } from '../store/store.service';
import type { Shift, StaffMember } from '../store/types';

interface Tally {
  shifts: number;
  minutes: number;
}

export interface HoursRow {
  member: StaffMember;
  shifts: number;
  hours: number;
  overtimeHours: number;
  overtimePay: number;
}

export interface WeekHours {
  rows: HoursRow[];
  totalHours: number;
  totalOvertimePay: number;
}

/**
 * Weekly hours and overtime per person. Scanning every shift for a branch is
 * the slowest thing the hours page does, so the tallies are kept per
 * branch-week until that branch's rota changes.
 */
@Injectable()
export class HoursService {
  private readonly tallies = new Map<string, Map<number, Tally>>();

  constructor(
    private readonly store: StoreService,
    private readonly staff: StaffService,
    events: RotaEvents,
  ) {
    events.onShiftsChanged((branchId) => this.forget(branchId));
  }

  forWeek(branchId: string, weekStart: string): WeekHours {
    const tallies = this.talliesFor(branchId, weekStart);
    const rows = this.staff.byBranch(branchId).map((member) => {
      const tally = tallies.get(member.id) ?? { shifts: 0, minutes: 0 };
      const hours = tally.minutes / 60;
      const overtimeHours = Math.max(0, hours - STANDARD_WEEK_HOURS);
      return {
        member,
        shifts: tally.shifts,
        hours,
        overtimeHours,
        overtimePay: roundKobo(overtimeHours * member.hourlyRate * OVERTIME_MULTIPLIER),
      };
    });
    return {
      rows,
      totalHours: rows.reduce((sum, r) => sum + r.hours, 0),
      totalOvertimePay: roundKobo(rows.reduce((sum, r) => sum + r.overtimePay, 0)),
    };
  }

  private talliesFor(branchId: string, weekStart: string): Map<number, Tally> {
    const key = `${branchId}:${weekStart}`;
    const cached = this.tallies.get(key);
    if (cached) return cached;

    const weekEnd = addDays(weekStart, 6);
    const tallies = new Map<number, Tally>();
    for (const shift of this.store.db.shifts) {
      if (shift.branchId !== branchId || shift.staffId === null) continue;
      if (shift.date < weekStart || shift.date > weekEnd) continue;
      const tally = tallies.get(shift.staffId) ?? { shifts: 0, minutes: 0 };
      tally.shifts += 1;
      tally.minutes += workedMinutes(shift);
      tallies.set(shift.staffId, tally);
    }
    this.tallies.set(key, tallies);
    return tallies;
  }

  private forget(branchId: string): void {
    for (const key of this.tallies.keys()) {
      if (key.startsWith(`${branchId}:`)) this.tallies.delete(key);
    }
  }
}

/** Minutes worked on a shift. Overnight shifts count in full on the day they start. */
function workedMinutes(shift: Shift): number {
  return Math.max(0, toMinutes(shift.end) - toMinutes(shift.start));
}
