import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { RotaEvents } from '../common/rota-events';
import { overlaps } from '../common/time';
import { StaffService } from '../staff/staff.service';
import { StoreService } from '../store/store.service';
import type { Shift } from '../store/types';
import type { ShiftInput } from './shift-input';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly store: StoreService,
    private readonly staff: StaffService,
    private readonly activity: ActivityService,
    private readonly events: RotaEvents,
  ) {}

  find(id: number): Shift | undefined {
    return this.store.db.shifts.find((s) => s.id === id);
  }

  get(id: number): Shift {
    const shift = this.find(id);
    if (!shift) throw new NotFoundException('That shift no longer exists.');
    return shift;
  }

  /** Shifts for a branch from `from` to `to`, both dates included. */
  forBranch(branchId: string, from: string, to: string): Shift[] {
    return this.store.db.shifts
      .filter((s) => s.branchId === branchId && s.date >= from && s.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }

  upcomingFor(staffId: number, from: string): Shift[] {
    return this.store.db.shifts
      .filter((s) => s.staffId === staffId && s.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }

  openShifts(branchId: string, from: string): Shift[] {
    return this.store.db.shifts
      .filter((s) => s.branchId === branchId && s.staffId === null && s.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
  }

  /** Another shift this person already has that overlaps `shift`, if any. */
  clashFor(staffId: number, shift: Pick<Shift, 'id' | 'date' | 'start' | 'end'>): Shift | undefined {
    return this.store.db.shifts.find(
      (s) => s.id !== shift.id && s.staffId === staffId && s.date === shift.date && overlaps(s, shift),
    );
  }

  async create(branchId: string, input: ShiftInput, actor: string): Promise<Shift> {
    this.assertAssignable(branchId, input, 0);
    const shift: Shift = { id: this.store.nextId('shift'), branchId, ...input };
    this.store.db.shifts.push(shift);
    this.events.shiftsChanged(branchId);
    await this.activity.record(actor, `added a ${shift.position} shift on ${shift.date} for ${this.staff.nameOf(shift.staffId)}`);
    return shift;
  }

  async update(id: number, input: ShiftInput, actor: string): Promise<Shift> {
    const shift = this.get(id);
    this.assertAssignable(shift.branchId, input, id);
    Object.assign(shift, input);
    await this.activity.record(actor, `changed the ${shift.position} shift on ${shift.date} for ${this.staff.nameOf(shift.staffId)}`);
    return shift;
  }

  async assign(id: number, staffId: number): Promise<Shift> {
    const shift = this.get(id);
    shift.staffId = staffId;
    await this.store.flush();
    return shift;
  }

  async remove(id: number, actor: string): Promise<Shift> {
    const shift = this.get(id);
    const db = this.store.db;
    db.shifts = db.shifts.filter((s) => s.id !== id);
    db.swaps = db.swaps.filter((s) => s.shiftId !== id || s.status !== 'pending');
    await this.activity.record(actor, `removed the ${shift.position} shift on ${shift.date} for ${this.staff.nameOf(shift.staffId)}`);
    return shift;
  }

  private assertAssignable(branchId: string, input: ShiftInput, shiftId: number): void {
    if (input.staffId === null) return;
    const member = this.staff.find(input.staffId);
    if (!member || member.branchId !== branchId) {
      throw new BadRequestException('Please choose someone who works at this branch.');
    }
    const clash = this.clashFor(input.staffId, { id: shiftId, ...input });
    if (clash) {
      throw new ConflictException(`${member.name} already works ${clash.start} to ${clash.end} that day.`);
    }
  }
}
