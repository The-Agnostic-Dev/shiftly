import { ConflictException } from '@nestjs/common';
import { todayInLagos } from '../src/common/dates';
import { services } from './helpers';

describe('OpenShiftsService', () => {
  it('gives an open shift to the first person who takes it', async () => {
    const ctx = services();
    const open = ctx.shifts.openShifts('lekki', todayInLagos())[0];
    const taken = await ctx.openShifts.claim(open.id, 5);
    expect(taken.staffId).toBe(5);
    await expect(ctx.openShifts.claim(open.id, 4)).rejects.toThrow(ConflictException);
    expect(ctx.shifts.get(open.id).staffId).toBe(5);
  });

  it('refuses a shift on a day the person marked unavailable', async () => {
    const ctx = services();
    const open = ctx.shifts.openShifts('lekki', todayInLagos())[0];
    ctx.store.db.availability.find((a) => a.staffId === 5)!.unavailableDays.push(6);
    await expect(ctx.openShifts.claim(open.id, 5)).rejects.toThrow(ConflictException);
  });
});
