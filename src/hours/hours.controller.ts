import { Controller, Get, Query, Render } from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/decorators';
import { addDays, formatDate, resolveWeek } from '../common/dates';
import { formatAmount, formatNaira } from '../common/money';
import { StaffService } from '../staff/staff.service';
import type { User } from '../store/types';
import { HoursService } from './hours.service';

const hoursText = (h: number) => String(Math.round(h * 100) / 100);

@Controller('hours')
@Roles('manager', 'hr')
export class HoursController {
  constructor(
    private readonly hours: HoursService,
    private readonly staff: StaffService,
  ) {}

  @Get()
  @Render('hours')
  page(@CurrentUser() user: User, @Query('branch') branch?: string, @Query('week') week?: string) {
    const branchId = user.role === 'manager' ? user.branchId! : branch || 'lekki';
    const start = resolveWeek(week);
    const summary = this.hours.forWeek(branchId, start);
    return {
      title: 'Hours and overtime',
      branch: this.staff.branch(branchId),
      branches: user.role === 'hr' ? this.staff.branches().map((b) => ({ ...b, selected: b.id === branchId })) : null,
      week: start,
      weekLabel: `${formatDate(start)} to ${formatDate(addDays(start, 6))}`,
      prevWeek: addDays(start, -7),
      nextWeek: addDays(start, 7),
      rows: summary.rows.map((r) => ({
        id: r.member.id,
        name: r.member.name,
        position: r.member.position,
        rate: formatNaira(r.member.hourlyRate),
        shifts: r.shifts,
        hours: hoursText(r.hours),
        overtime: hoursText(r.overtimeHours),
        overtimePay: formatAmount(r.overtimePay),
        hasOvertime: r.overtimeHours > 0,
      })),
      totalHours: hoursText(summary.totalHours),
      totalOvertimePay: formatNaira(summary.totalOvertimePay),
    };
  }
}
