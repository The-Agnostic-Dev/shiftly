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

  it('offers only same-branch colleagues in the swap candidate list', async () => {
    const ctx = services();
    const shift = shiftOf(ctx, 1, nextWeek);
    const candidates = await ctx.swaps.candidatesFor(shift.id);
    const ids = candidates.map((c) => c.id).sort((a, b) => a - b);
    expect(ids).toEqual([2, 3, 4, 5, 6, 7]);
    expect(candidates.some((c) => c.name === 'Kemi Ogunleye')).toBe(false);
    expect(candidates.some((c) => c.name === 'Femi Lawal')).toBe(false);
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
});
