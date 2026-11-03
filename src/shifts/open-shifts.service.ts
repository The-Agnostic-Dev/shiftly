import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { ActivityService } from '../activity/activity.service';
import { AvailabilityService } from '../availability/availability.service';
import { formatDate } from '../common/dates';
import { StaffService } from '../staff/staff.service';
import type { Shift } from '../store/types';
import { ShiftsService } from './shifts.service';

/** Staff picking up shifts nobody has been assigned to yet. */
@Injectable()
export class OpenShiftsService {
  constructor(
    private readonly shifts: ShiftsService,
    private readonly staff: StaffService,
    private readonly availability: AvailabilityService,
    private readonly activity: ActivityService,
  ) {}

  async claim(shiftId: number, staffId: number): Promise<Shift> {
    const shift = this.shifts.get(shiftId);
    const member = this.staff.get(staffId);

    if (shift.branchId !== member.branchId) throw new ForbiddenException('That shift is at another branch.');
    if (shift.staffId !== null) throw new ConflictException('Sorry, someone else has already taken this shift.');
    if (this.availability.isUnavailable(staffId, shift.date)) {
      throw new ConflictException('You told us you are not available that day. Update your availability first.');
    }
    if (this.shifts.clashFor(staffId, shift)) {
      throw new ConflictException('You already have a shift that overlaps this one.');
    }

    await this.activity.record(member.name, `took the open ${shift.position} shift on ${formatDate(shift.date)}`);
    return this.shifts.assign(shift.id, staffId);
  }
}
