import { Injectable } from '@nestjs/common';
import { isoWeekday } from '../common/dates';
import { StoreService } from '../store/store.service';

export const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

@Injectable()
export class AvailabilityService {
  constructor(private readonly store: StoreService) {}

  /** ISO weekdays (1 = Monday ... 7 = Sunday) this person cannot work. */
  daysFor(staffId: number): number[] {
    return this.store.db.availability.find((a) => a.staffId === staffId)?.unavailableDays ?? [];
  }

  noteFor(staffId: number): string {
    return this.store.db.availability.find((a) => a.staffId === staffId)?.note ?? '';
  }

  isUnavailable(staffId: number, date: string): boolean {
    return this.daysFor(staffId).includes(isoWeekday(date));
  }

  describe(staffId: number): string {
    const days = this.daysFor(staffId);
    return WEEKDAYS.filter((d) => days.includes(d.value))
      .map((d) => d.label)
      .join(', ');
  }

  async save(staffId: number, days: number[], note: string): Promise<void> {
    const clean = [...new Set(days)].filter((d) => d >= 1 && d <= 7).sort();
    const existing = this.store.db.availability.find((a) => a.staffId === staffId);
    if (existing) {
      existing.unavailableDays = clean;
      existing.note = note;
    } else {
      this.store.db.availability.push({ staffId, unavailableDays: clean, note });
    }
    await this.store.flush();
  }
}
