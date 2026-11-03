import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { isPosition } from '../common/positions';
import { StoreService } from '../store/store.service';
import type { Branch, StaffMember } from '../store/types';
import { ActivityService } from '../activity/activity.service';

export interface StaffInput {
  name?: string;
  position?: string;
  branchId?: string;
  phone?: string;
  hourlyRate?: string;
}

@Injectable()
export class StaffService {
  constructor(
    private readonly store: StoreService,
    private readonly activity: ActivityService,
  ) {}

  branches(): Branch[] {
    return this.store.db.branches;
  }

  branch(id: string): Branch {
    const branch = this.store.db.branches.find((b) => b.id === id);
    if (!branch) throw new NotFoundException('There is no branch with that name.');
    return branch;
  }

  all(): StaffMember[] {
    return [...this.store.db.staff].sort((a, b) => a.name.localeCompare(b.name));
  }

  byBranch(branchId: string): StaffMember[] {
    return this.all().filter((s) => s.branchId === branchId);
  }

  find(id: number): StaffMember | undefined {
    return this.store.db.staff.find((s) => s.id === id);
  }

  get(id: number): StaffMember {
    const member = this.find(id);
    if (!member) throw new NotFoundException('We could not find that staff member.');
    return member;
  }

  nameOf(id: number | null): string {
    return id === null ? 'Open shift' : (this.find(id)?.name ?? 'Former staff');
  }

  async update(id: number, input: StaffInput, actor: string): Promise<StaffMember> {
    const member = this.get(id);
    const name = input.name?.trim() ?? '';
    const rate = Number.parseFloat(input.hourlyRate ?? '');

    if (name.length < 3) throw new BadRequestException('Please enter the full name.');
    if (!isPosition(input.position)) throw new BadRequestException('Please choose a position from the list.');
    if (!this.store.db.branches.some((b) => b.id === input.branchId)) {
      throw new BadRequestException('Please choose a branch.');
    }
    if (!Number.isFinite(rate) || rate <= 0) throw new BadRequestException('Hourly rate must be more than ₦0.');

    Object.assign(member, {
      name,
      position: input.position,
      branchId: input.branchId,
      phone: input.phone?.trim() ?? '',
      hourlyRate: Math.round(rate * 100) / 100,
    });
    await this.activity.record(actor, `updated the staff record for ${member.name}`);
    return member;
  }
}
