import {
  Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, Query, Render, Req, Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser, Roles } from '../auth/decorators';
import { formatDate, isIsoDate, todayInLagos, weekStart } from '../common/dates';
import { flash } from '../common/flash';
import { POSITIONS } from '../common/positions';
import { shiftMinutes, formatHours, isOvernight } from '../common/time';
import { StaffService } from '../staff/staff.service';
import type { Shift, User } from '../store/types';
import { OpenShiftsService } from './open-shifts.service';
import { parseShiftForm, ShiftForm } from './shift-input';
import { ShiftsService } from './shifts.service';

@Controller()
export class ShiftsController {
  constructor(
    private readonly shifts: ShiftsService,
    private readonly openShifts: OpenShiftsService,
    private readonly staff: StaffService,
  ) {}

  @Get('shifts/new')
  @Roles('manager')
  @Render('shift-form')
  newShift(@CurrentUser() user: User, @Query('date') date?: string, @Query('staff') staffId?: string) {
    return this.formModel(user.branchId!, {
      title: 'Add a shift',
      action: '/shifts',
      shift: {
        date: isIsoDate(date) ? date : todayInLagos(),
        start: '09:00',
        end: '17:00',
        staffId: staffId ? Number(staffId) : null,
        position: '',
        note: '',
      },
    });
  }

  @Post('shifts')
  @Roles('manager')
  async create(@Body() body: ShiftForm, @CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const shift = await this.shifts.create(user.branchId!, parseShiftForm(body), user.name);
    flash(req, 'success', `Shift added for ${this.staff.nameOf(shift.staffId)} on ${formatDate(shift.date)}.`);
    return res.redirect(`/rota?week=${weekStart(shift.date)}#shift-${shift.id}`);
  }

  @Get('shifts/:id/edit')
  @Roles('manager')
  @Render('shift-form')
  edit(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    const shift = this.managed(id, user);
    return this.formModel(shift.branchId, { title: 'Edit shift', action: `/shifts/${shift.id}`, shift, editing: true });
  }

  @Post('shifts/:id')
  @Roles('manager')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ShiftForm,
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.managed(id, user);
    const shift = await this.shifts.update(id, parseShiftForm(body), user.name);
    flash(req, 'success', `Shift on ${formatDate(shift.date)} updated.`);
    return res.redirect(`/rota?week=${weekStart(shift.date)}#shift-${shift.id}`);
  }

  @Post('shifts/:id/delete')
  @Roles('manager')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    this.managed(id, user);
    const shift = await this.shifts.remove(id, user.name);
    flash(req, 'success', `Shift on ${formatDate(shift.date)} removed.`);
    return res.redirect(`/rota?week=${weekStart(shift.date)}`);
  }

  @Get('my-shifts')
  @Roles('staff')
  @Render('my-shifts')
  mine(@CurrentUser() user: User) {
    const today = todayInLagos();
    const describe = (s: Shift) => ({
      ...s,
      day: formatDate(s.date),
      hours: formatHours(shiftMinutes(s.start, s.end)),
      overnight: isOvernight(s.start, s.end),
    });
    return {
      title: 'My shifts',
      shifts: this.shifts.upcomingFor(user.staffId!, today).map(describe),
      open: this.shifts.openShifts(user.branchId!, today).map(describe),
      branch: this.staff.branch(user.branchId!),
    };
  }

  @Post('shifts/:id/claim')
  @Roles('staff')
  async claim(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const shift = await this.openShifts.claim(id, user.staffId!);
    flash(req, 'success', `The shift on ${formatDate(shift.date)} (${shift.start} to ${shift.end}) is yours.`);
    return res.redirect('/my-shifts');
  }

  private managed(id: number, user: User): Shift {
    const shift = this.shifts.get(id);
    if (shift.branchId !== user.branchId) throw new ForbiddenException('That shift belongs to another branch.');
    return shift;
  }

  private formModel(branchId: string, model: Record<string, unknown> & { shift: Partial<Shift> }) {
    return {
      ...model,
      branch: this.staff.branch(branchId),
      positions: POSITIONS,
      people: this.staff.byBranch(branchId).map((m) => ({ ...m, selected: m.id === model.shift.staffId })),
    };
  }
}
