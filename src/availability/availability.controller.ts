import { Body, Controller, Get, Post, Render, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser, Roles } from '../auth/decorators';
import { flash } from '../common/flash';
import type { User } from '../store/types';
import { AvailabilityService, WEEKDAYS } from './availability.service';

@Controller('availability')
@Roles('staff')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get()
  @Render('availability')
  page(@CurrentUser() user: User) {
    const days = this.availability.daysFor(user.staffId!);
    return {
      title: 'My availability',
      days: WEEKDAYS.map((d) => ({ ...d, checked: days.includes(d.value) })),
      note: this.availability.noteFor(user.staffId!),
    };
  }

  @Post()
  async save(
    @Body() body: { days?: string | string[]; note?: string },
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const raw = body.days === undefined ? [] : ([] as string[]).concat(body.days);
    await this.availability.save(user.staffId!, raw.map(Number), (body.note ?? '').trim());
    flash(req, 'success', 'Your availability has been saved. Your manager will see it on the rota.');
    return res.redirect('/availability');
  }
}
