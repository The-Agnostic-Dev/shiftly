import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Render, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser, Roles } from '../auth/decorators';
import { formatDate, formatDateTime } from '../common/dates';
import { flash } from '../common/flash';
import type { User } from '../store/types';
import { SwapsService } from './swaps.service';

@Controller('swaps')
export class SwapsController {
  constructor(private readonly swaps: SwapsService) {}

  @Get()
  @Render('swaps')
  list(@CurrentUser() user: User) {
    const rows = this.swaps.listFor(user).map((swap) => ({
      ...swap,
      requestedAt: formatDateTime(swap.createdAt),
      decidedAtText: swap.decidedAt ? formatDateTime(swap.decidedAt) : '',
      shiftDay: swap.shift ? formatDate(swap.shift.date) : 'Removed shift',
      pending: swap.status === 'pending',
      mine: swap.fromStaffId === user.staffId,
    }));
    return {
      title: 'Shift swaps',
      rows,
      isManager: user.role === 'manager',
      isStaff: user.role === 'staff',
      pendingCount: rows.filter((r) => r.pending).length,
    };
  }

  @Get('new')
  @Roles('staff')
  @Render('swap-form')
  newRequest(@Query('shift', ParseIntPipe) shiftId: number, @CurrentUser() user: User) {
    const shift = this.swaps.ownShift(shiftId, user.staffId!);
    return {
      title: 'Ask for a swap',
      shift: { ...shift, day: formatDate(shift.date) },
      colleagues: this.swaps.candidatesFor(shift),
    };
  }

  @Post()
  @Roles('staff')
  async create(
    @Body() body: { shiftId?: string; toStaffId?: string; reason?: string },
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.swaps.request(Number(body.shiftId), user.staffId!, Number(body.toStaffId), body.reason ?? '');
    flash(req, 'success', 'Your swap request has been sent to your manager.');
    return res.redirect('/swaps');
  }

  @Post(':id/approve')
  @Roles('manager')
  async approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    await this.swaps.approve(id, user);
    flash(req, 'success', 'Swap approved. The rota has been updated.');
    return res.redirect('/swaps');
  }

  @Post(':id/decline')
  @Roles('manager')
  async decline(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    await this.swaps.decline(id, user);
    flash(req, 'info', 'Swap declined.');
    return res.redirect('/swaps');
  }

  @Post(':id/withdraw')
  @Roles('staff')
  async withdraw(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    await this.swaps.withdraw(id, user.staffId!);
    flash(req, 'info', 'Your swap request has been withdrawn.');
    return res.redirect('/swaps');
  }
}
