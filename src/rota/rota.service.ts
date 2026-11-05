import { Injectable } from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { addDays, isoWeekday, todayInLagos, weekDates } from '../common/dates';
import { formatHours, isOvernight, shiftMinutes, splitShift } from '../common/time';
import type { ShiftPortion } from '../common/time';
import { ShiftsService } from '../shifts/shifts.service';
import { StaffService } from '../staff/staff.service';
import type { Shift } from '../store/types';

export interface RotaShift extends Shift {
  hours: string;
  overnight: boolean;
  unavailable: boolean;
}

export interface RotaCell {
  date: string;
  shifts: RotaShift[];
}

export interface RotaRow {
  staffId: number | null;
  name: string;
  position: string;
  cells: RotaCell[];
  hours: string;
}

export interface RotaWeek {
  days: Array<{ date: string; today: boolean; headcount: number }>;
  rows: RotaRow[];
  openRow: RotaRow;
  shiftCount: number;
}

@Injectable()
export class RotaService {
  constructor(
    private readonly shifts: ShiftsService,
    private readonly staff: StaffService,
    private readonly availability: AvailabilityService,
  ) {}

  week(branchId: string, start: string): RotaWeek {
    const dates = weekDates(start);
    const today = todayInLagos();
    const shifts = this.shifts.forBranch(branchId, addDays(start, -1), addDays(start, 6));

    interface Portion extends ShiftPortion {
      shift: Shift;
    }

    const portions: Portion[] = shifts.flatMap((shift) =>
      splitShift(shift)
        .filter((p) => dates.includes(p.date))
        .map((p) => ({ ...p, shift })),
    );

    const decorate = (portion: Portion, offDays: number[]): RotaShift => ({
      ...portion.shift,
      date: portion.date,
      start: portion.start,
      end: portion.end,
      hours: formatHours(portion.minutes),
      overnight: portion.date === portion.shift.date && isOvernight(portion.shift.start, portion.shift.end),
      unavailable: offDays.includes(isoWeekday(portion.shift.date)),
    });

    const rowFor = (staffId: number | null, name: string, position: string): RotaRow => {
      const offDays = staffId === null ? [] : this.availability.daysFor(staffId);
      const mine = portions.filter((p) => p.shift.staffId === staffId);
      return {
        staffId,
        name,
        position,
        cells: dates.map((date) => ({
          date,
          shifts: mine.filter((p) => p.date === date).map((p) => decorate(p, offDays)),
        })),
        hours: formatHours(mine.reduce((sum, p) => sum + p.minutes, 0)),
      };
    };

    const rows = this.staff.byBranch(branchId).map((m) => rowFor(m.id, m.name, m.position));
    return {
      days: dates.map((date) => ({
        date,
        today: date === today,
        headcount: new Set(portions.filter((p) => p.date === date && p.shift.staffId !== null).map((p) => p.shift.staffId)).size,
      })),
      rows,
      openRow: rowFor(null, 'Open shifts', 'Anyone in the branch can take these'),
      shiftCount: new Set(portions.map((p) => p.shift.id)).size,
    };
  }
}
