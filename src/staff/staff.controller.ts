import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Render, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser, Roles } from '../auth/decorators';
import { flash } from '../common/flash';
import { POSITIONS } from '../common/positions';
import type { User } from '../store/types';
import { StaffInput, StaffService } from './staff.service';
import { AvailabilityService } from '../availability/availability.service';

@Controller('staff')
@Roles('manager', 'hr')
export class StaffController {
  constructor(
    private readonly staff: StaffService,
    private readonly availability: AvailabilityService,
  ) {}

  @Get()
  @Render('staff')
  list(@CurrentUser() user: User, @Query('branch') branch?: string) {
    const branchId = user.role === 'manager' ? user.branchId! : branch || '';
    const members = branchId ? this.staff.byBranch(branchId) : this.staff.all();
    return {
      title: 'Staff',
      branches: this.staff.branches(),
      branchId,
      canEdit: user.role === 'hr',
      members: members.map((m) => ({
        ...m,
        branchName: this.staff.branch(m.branchId).name,
        unavailable: this.availability.describe(m.id),
      })),
    };
  }

  @Get(':id/edit')
  @Roles('hr')
  @Render('staff-form')
  edit(@Param('id', ParseIntPipe) id: number) {
    const member = this.staff.get(id);
    return {
      title: `Edit ${member.name}`,
      member,
      positions: POSITIONS,
      branches: this.staff.branches(),
    };
  }

  @Post(':id')
  @Roles('hr')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: StaffInput,
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const member = await this.staff.update(id, body, user.name);
    flash(req, 'success', `Saved ${member.name}.`);
    return res.redirect('/staff');
  }
}
