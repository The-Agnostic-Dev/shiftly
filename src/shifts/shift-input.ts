import { BadRequestException } from '@nestjs/common';
import { isIsoDate } from '../common/dates';
import { isPosition } from '../common/positions';
import { isTime } from '../common/time';

/** What the add/edit shift form posts. */
export interface ShiftForm {
  staffId?: string;
  date?: string;
  start?: string;
  end?: string;
  position?: string;
  note?: string;
}

export interface ShiftInput {
  staffId: number | null;
  date: string;
  start: string;
  end: string;
  position: string;
  note: string;
}

export function parseShiftForm(form: ShiftForm): ShiftInput {
  if (!isIsoDate(form.date)) throw new BadRequestException('Please pick a date for the shift.');
  if (!isTime(form.start) || !isTime(form.end)) {
    throw new BadRequestException('Start and end times must look like 09:00 or 17:30.');
  }
  if (form.start === form.end) throw new BadRequestException('A shift cannot start and end at the same time.');
  if (!isPosition(form.position)) throw new BadRequestException('Please choose a position for the shift.');

  const staffId = form.staffId ? Number(form.staffId) : null;
  if (staffId !== null && !Number.isInteger(staffId)) throw new BadRequestException('Please choose who works this shift.');

  return {
    staffId,
    date: form.date,
    start: form.start,
    end: form.end,
    position: form.position,
    note: (form.note ?? '').trim().slice(0, 200),
  };
}
