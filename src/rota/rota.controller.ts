import { Controller, Get, Query, Render, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ActivityService } from '../activity/activity.service';
import { AuthService } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators';
import { addDays, formatDate, formatDateTime, resolveWeek, todayInLagos, weekStart } from '../common/dates';
import { StaffService } from '../staff/staff.service';
import type { User } from '../store/types';
import { RotaService } from './rota.service';

@Controller()
export class RotaController {
  constructor(
    private readonly rota: RotaService,
    private readonly staff: StaffService,
    private readonly activity: ActivityService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  home(@CurrentUser() user: User, @Res() res: Response) {
    return res.redirect(this.auth.homeFor(user));
  }

  @Get('rota')
  @Render('rota')
  page(@CurrentUser() user: User, @Query('branch') branch?: string, @Query('week') week?: string) {
    const branchId = user.branchId ?? (branch || 'lekki');
    const start = resolveWeek(week);
    const isManager = user.role === 'manager';
    return {
      title: 'Weekly rota',
      branch: this.staff.branch(branchId),
      branches: user.role === 'hr' ? this.staff.branches().map((b) => ({ ...b, selected: b.id === branchId })) : null,
      week: start,
      weekLabel: `${formatDate(start)} to ${formatDate(addDays(start, 6))}`,
      isThisWeek: start === weekStart(todayInLagos()),
      prevWeek: addDays(start, -7),
      nextWeek: addDays(start, 7),
      canEdit: isManager,
      rota: this.rota.week(branchId, start),
      activity: isManager
        ? this.activity.recent().map((a) => ({ ...a, when: formatDateTime(a.at) }))
        : [],
    };
  }
}
