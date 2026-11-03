import type { Flash } from '../common/flash';

export type UserRole = 'manager' | 'staff' | 'hr';

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export interface StaffMember {
  id: number;
  name: string;
  position: string;
  branchId: string;
  phone: string;
  /** Naira per hour */
  hourlyRate: number;
}

export interface User {
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  branchId?: string;
  staffId?: number;
}

export interface Shift {
  id: number;
  branchId: string;
  /** null while the shift is open for anyone in the branch to take */
  staffId: number | null;
  date: string;
  start: string;
  end: string;
  position: string;
  note: string;
}

export type SwapStatus = 'pending' | 'approved' | 'declined';

export interface SwapRequest {
  id: number;
  shiftId: number;
  fromStaffId: number;
  toStaffId: number;
  reason: string;
  status: SwapStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface Availability {
  staffId: number;
  /** ISO weekdays the person cannot work: 1 = Monday ... 7 = Sunday */
  unavailableDays: number[];
  note: string;
}

export interface ActivityEntry {
  at: string;
  actor: string;
  message: string;
}

export interface Database {
  seededAt: string;
  branches: Branch[];
  staff: StaffMember[];
  users: User[];
  shifts: Shift[];
  swaps: SwapRequest[];
  availability: Availability[];
  activity: ActivityEntry[];
  sequences: { shift: number; swap: number };
}

export interface SessionData {
  username: string;
  flash?: Flash;
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: SessionData;
    user?: User;
  }
}
