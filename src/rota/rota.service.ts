import { Injectable } from '@nestjs/common';
import { AvailabilityService } from '../availability/availability.service';
import { addDays, todayInLagos, weekDates } from '../common/dates';
import { formatHours, isOvernight, shiftMinutes } from '../common/time';
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
    const shifts = this.shifts.forBranch(branchId, start, addDays(start, 6));

    const decorate = (shift: Shift, offDays: number[]): RotaShift => ({
      ...shift,
      hours: formatHours(shiftMinutes(shift.start, shift.end)),
      overnight: isOvernight(shift.start, shift.end),
      unavailable: offDays.includes(new Date(`${shift.date}T00:00:00Z`).getUTCDay()),
    });

    const rowFor = (staffId: number | null, name: string, position: string): RotaRow => {
      const offDays = staffId === null ? [] : this.availability.daysFor(staffId);
      const mine = shifts.filter((s) => s.staffId === staffId);
      return {
        staffId,
        name,
        position,
        cells: dates.map((date) => ({
          date,
          shifts: mine.filter((s) => s.date === date).map((s) => decorate(s, offDays)),
        })),
        hours: formatHours(mine.reduce((sum, s) => sum + shiftMinutes(s.start, s.end), 0)),
      };
    };

    const rows = this.staff.byBranch(branchId).map((m) => rowFor(m.id, m.name, m.position));
    return {
      days: dates.map((date) => ({
        date,
        today: date === today,
        headcount: new Set(shifts.filter((s) => s.date === date && s.staffId !== null).map((s) => s.staffId)).size,
      })),
      rows,
      openRow: rowFor(null, 'Open shifts', 'Anyone in the branch can take these'),
      shiftCount: shifts.length,
    };
  }
}
