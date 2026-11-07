import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { formatDate, todayInLagos } from '../common/dates';
import { ShiftsService } from '../shifts/shifts.service';
import { StaffService } from '../staff/staff.service';
import { StoreService } from '../store/store.service';
import type { Shift, StaffMember, SwapRequest, User } from '../store/types';

export interface SwapOutcome {
  approved: boolean;
  reason?: string;
}

export interface SwapView extends SwapRequest {
  shift?: Shift;
  fromName: string;
  toName: string;
  branchId?: string;
}

@Injectable()
export class SwapsService {
  constructor(
    private readonly store: StoreService,
    private readonly shifts: ShiftsService,
    private readonly staff: StaffService,
    private readonly activity: ActivityService,
  ) {}

  /** Requests visible to this user: waiting ones first, newest at the top, then finished ones oldest last. */
  listFor(user: User): SwapView[] {
    return this.store.db.swaps
      .map((swap) => this.view(swap))
      .filter((swap) => {
        if (user.role === 'hr') return true;
        if (user.role === 'manager') return swap.branchId === user.branchId;
        return swap.fromStaffId === user.staffId || swap.toStaffId === user.staffId;
      })
      .sort((a, b) => {
        const pending = Number(b.status === 'pending') - Number(a.status === 'pending');
        return pending || b.createdAt.localeCompare(a.createdAt);
      });
  }

  /** Colleagues who could take this shift instead. */
  candidatesFor(shift: Shift): StaffMember[] {
    return this.staff.all().filter((m) => m.id !== shift.staffId);
  }

  ownShift(shiftId: number, staffId: number): Shift {
    const shift = this.shifts.get(shiftId);
    if (shift.staffId !== staffId) throw new ForbiddenException('You can only swap your own shifts.');
    return shift;
  }

  async request(shiftId: number, fromStaffId: number, toStaffId: number, reason: string): Promise<SwapRequest> {
    const shift = this.ownShift(shiftId, fromStaffId);
    if (shift.date < todayInLagos()) throw new BadRequestException('That shift has already happened.');
    const colleague = this.staff.find(toStaffId);
    if (!colleague || colleague.id === fromStaffId || colleague.branchId !== shift.branchId) {
      throw new BadRequestException('Please choose a colleague from your branch.');
    }
    if (this.store.db.swaps.some((s) => s.shiftId === shiftId && s.status === 'pending')) {
      throw new ConflictException('There is already a swap request waiting for this shift.');
    }

    const swap: SwapRequest = {
      id: this.store.nextId('swap'),
      shiftId,
      fromStaffId,
      toStaffId,
      reason: reason.trim().slice(0, 200),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.store.db.swaps.push(swap);
    await this.activity.record(this.staff.nameOf(fromStaffId), `asked to swap their shift on ${formatDate(shift.date)} with ${colleague.name}`);
    return swap;
  }

  /**
   * Hands the shift to the colleague. Refused (without changing anything) if
   * the colleague is already working at that time.
   */
  async approve(id: number, manager: User): Promise<SwapOutcome> {
    const swap = this.pendingFor(id, manager);
    const shift = this.shifts.get(swap.shiftId);
    const clash = this.shifts.clashFor(swap.toStaffId, shift);
    if (clash) {
      return {
        approved: false,
        reason: `${this.staff.nameOf(swap.toStaffId)} already works ${clash.start} to ${clash.end} on ${formatDate(shift.date)}.`,
      };
    }

    await this.shifts.assign(shift.id, swap.toStaffId);
    this.decide(swap, 'approved', manager);
    await this.activity.record(manager.name, `approved the swap from ${this.staff.nameOf(swap.fromStaffId)} to ${this.staff.nameOf(swap.toStaffId)}`);
    return { approved: true };
  }

  async decline(id: number, manager: User): Promise<void> {
    const swap = this.pendingFor(id, manager);
    this.decide(swap, 'declined', manager);
    await this.activity.record(manager.name, `declined the swap from ${this.staff.nameOf(swap.fromStaffId)} to ${this.staff.nameOf(swap.toStaffId)}`);
  }

  async withdraw(id: number, staffId: number): Promise<void> {
    const swap = this.store.db.swaps.find((s) => s.id === id);
    if (!swap || swap.fromStaffId !== staffId) throw new NotFoundException('We could not find that request.');
    if (swap.status !== 'pending') throw new ConflictException('That request has already been decided.');
    this.store.db.swaps = this.store.db.swaps.filter((s) => s.id !== id);
    await this.store.flush();
  }

  private pendingFor(id: number, manager: User): SwapRequest {
    const swap = this.store.db.swaps.find((s) => s.id === id);
    if (!swap) throw new NotFoundException('We could not find that request.');
    const shift = this.shifts.get(swap.shiftId);
    if (shift.branchId !== manager.branchId) throw new ForbiddenException('That request is for another branch.');
    if (swap.status !== 'pending') throw new ConflictException('That request has already been decided.');
    return swap;
  }

  private decide(swap: SwapRequest, status: 'approved' | 'declined', manager: User): void {
    swap.status = status;
    swap.decidedAt = new Date().toISOString();
    swap.decidedBy = manager.name;
  }

  private view(swap: SwapRequest): SwapView {
    const shift = this.shifts.find(swap.shiftId);
    return {
      ...swap,
      shift,
      branchId: shift?.branchId,
      fromName: this.staff.nameOf(swap.fromStaffId),
      toName: this.staff.nameOf(swap.toStaffId),
    };
  }
}
