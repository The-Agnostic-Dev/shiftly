import { Injectable } from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { addDays, isoWeekday, todayInLagos, weekDates } from '../common/dates';
import { formatHours, isOvernight, splitShift, type ShiftSegment } from '../common/time';
import { ShiftsService } from '../shifts/shifts.service';
import { StaffService } from '../staff/staff.service';
import type { Shift } from '../store/types';

export interface RotaShift extends Shift {
  hours: string;
  overnight: boolean;
  continuation: boolean;
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

    const decorate = (shift: Shift, segment: ShiftSegment, date: string, offDays: number[]): RotaShift => ({
      ...shift,
      date,
      start: segment.start,
      end: segment.end,
      hours: formatHours(segment.minutes),
      overnight: isOvernight(shift.start, shift.end),
      continuation: segment.dayOffset === 1,
      unavailable: offDays.includes(isoWeekday(date)),
    });

    const rowFor = (staffId: number | null, name: string, position: string): RotaRow => {
      const offDays = staffId === null ? [] : this.availability.daysFor(staffId);
      const mine = shifts.filter((s) => s.staffId === staffId);
      const cells = dates.map((date) => ({ date, shifts: [] as RotaShift[] }));
      let totalMinutes = 0;
      for (const shift of mine) {
        for (const segment of splitShift(shift)) {
          const segDate = addDays(shift.date, segment.dayOffset);
          if (!dates.includes(segDate)) continue;
          const cell = cells.find((c) => c.date === segDate);
          if (cell) {
            cell.shifts.push(decorate(shift, segment, segDate, offDays));
            totalMinutes += segment.minutes;
          }
        }
      }
      return {
        staffId,
        name,
        position,
        cells,
        hours: formatHours(totalMinutes),
      };
    };

    const rows = this.staff.byBranch(branchId).map((m) => rowFor(m.id, m.name, m.position));
    const weekShifts = shifts.filter((s) => s.date >= start && s.date <= addDays(start, 6));

    const days = dates.map((date, index) => {
      const staffOnDay = new Set<number>();
      for (const row of rows) {
        for (const shift of row.cells[index].shifts) {
          if (shift.staffId !== null) staffOnDay.add(shift.staffId);
        }
      }
      return { date, today: date === today, headcount: staffOnDay.size };
    });

    return {
      days,
      rows,
      openRow: rowFor(null, 'Open shifts', 'Anyone in the branch can take these'),
      shiftCount: weekShifts.length,
    };
  }
}
