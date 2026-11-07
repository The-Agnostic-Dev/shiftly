import { BadRequestException, ConflictException } from '@nestjs/common';
import { addDays, todayInLagos, weekStart } from '../src/common/dates';
import type { User } from '../src/store/types';
import { services } from './helpers';

const manager = { username: 'manager.lekki', name: 'Adaeze Okafor', role: 'manager', branchId: 'lekki' } as User;

describe('SwapsService', () => {
  const nextWeek = addDays(weekStart(todayInLagos()), 7);

  function shiftOf(ctx: ReturnType<typeof services>, staffId: number, date: string) {
    return ctx.store.db.shifts.find((s) => s.staffId === staffId && s.date === date)!;
  }

  it('hands the shift over when the manager approves', async () => {
    const ctx = services();
    const shift = shiftOf(ctx, 1, nextWeek);
    const pending = ctx.store.db.swaps.find((s) => s.shiftId === shift.id && s.status === 'pending')!;
    const outcome = await ctx.swaps.approve(pending.id, manager);
    expect(outcome.approved).toBe(true);
    expect(ctx.shifts.get(shift.id).staffId).toBe(pending.toStaffId);
    expect(pending.status).toBe('approved');
  });

  it('records a declined request without touching the rota', async () => {
    const ctx = services();
    const shift = shiftOf(ctx, 1, nextWeek);
    const pending = ctx.store.db.swaps.find((s) => s.shiftId === shift.id)!;
    await ctx.swaps.decline(pending.id, manager);
    expect(pending.status).toBe('declined');
    expect(ctx.shifts.get(shift.id).staffId).toBe(1);
  });

  it('only lets staff swap with colleagues at the same branch', async () => {
    const ctx = services();
    const shift = shiftOf(ctx, 7, addDays(nextWeek, 3));
    await expect(ctx.swaps.request(shift.id, 7, 9, 'Exam')).rejects.toThrow(BadRequestException);
    await expect(ctx.swaps.request(shift.id, 7, 7, 'Exam')).rejects.toThrow(BadRequestException);
    const swap = await ctx.swaps.request(shift.id, 7, 6, 'Exam');
    expect(swap.status).toBe('pending');
    await expect(ctx.swaps.request(shift.id, 7, 1, 'Exam')).rejects.toThrow(ConflictException);
  });

  it('shows the newest pending request first and the oldest finished request last', () => {
    const ctx = services();
    const views = ctx.swaps.listFor(manager);
    expect(views[0].reason).toBe("My daughter's naming ceremony");
    expect(views[0].status).toBe('pending');
    expect(views[views.length - 1].reason).toBe('Family wedding in Enugu');
    expect(views.filter((v) => v.status === 'pending').map((v) => v.reason)).toEqual([
      "My daughter's naming ceremony",
      'Hospital appointment for my mum',
    ]);
    expect(views.map((v) => v.status)).toEqual(['pending', 'pending', 'declined', 'approved']);
  });

  it('keeps a request finished today below the ones still waiting', async () => {
    const ctx = services();
    const swap = ctx.store.db.swaps.find((s) => s.reason === 'Hospital appointment for my mum')!;
    await ctx.swaps.decline(swap.id, manager);
    const views = ctx.swaps.listFor(manager);
    expect(views[0].reason).toBe("My daughter's naming ceremony");
    expect(views.slice(1).every((v) => v.status !== 'pending')).toBe(true);
    expect(views.findIndex((v) => v.id === swap.id)).toBeGreaterThan(0);
  });
});
