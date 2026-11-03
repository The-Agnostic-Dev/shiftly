import { hashPassword } from '../auth/password';
import { addDays, todayInLagos, weekStart } from '../common/dates';
import type { Availability, Branch, Database, Shift, StaffMember, SwapRequest, User } from './types';

export const DEMO_PASSWORD = 'shiftly2026';

const branches: Branch[] = [
  { id: 'lekki', name: 'Lekki Phase 1', address: '14 Admiralty Way, Lekki Phase 1' },
  { id: 'ikeja', name: 'Ikeja GRA', address: '7 Isaac John Street, Ikeja GRA' },
  { id: 'vi', name: 'Victoria Island', address: '23 Ajose Adeogun Street, Victoria Island' },
];

const staff: StaffMember[] = [
  { id: 1, name: 'Tunde Bakare', position: 'Head chef', branchId: 'lekki', phone: '0803 412 7781', hourlyRate: 2500 },
  { id: 2, name: 'Emeka Nwosu', position: 'Sous chef', branchId: 'lekki', phone: '0806 221 9034', hourlyRate: 1800 },
  { id: 3, name: 'Ngozi Eze', position: 'Waiter', branchId: 'lekki', phone: '0812 773 1406', hourlyRate: 1200 },
  { id: 4, name: 'Chidi Okonkwo', position: 'Kitchen porter', branchId: 'lekki', phone: '0705 318 2290', hourlyRate: 1000 },
  { id: 5, name: 'Aisha Bello', position: 'Cashier', branchId: 'lekki', phone: '0909 554 0127', hourlyRate: 1100 },
  { id: 6, name: 'Funke Adeyemi', position: 'Waiter', branchId: 'lekki', phone: '0814 660 3381', hourlyRate: 1200 },
  { id: 7, name: 'Musa Ibrahim', position: 'Barman', branchId: 'lekki', phone: '0802 937 4415', hourlyRate: 1300 },
  { id: 8, name: 'Kemi Ogunleye', position: 'Head chef', branchId: 'ikeja', phone: '0803 100 2275', hourlyRate: 2400 },
  { id: 9, name: 'Segun Alabi', position: 'Line cook', branchId: 'ikeja', phone: '0816 402 8817', hourlyRate: 1400 },
  { id: 10, name: 'Halima Yusuf', position: 'Waiter', branchId: 'ikeja', phone: '0703 225 6649', hourlyRate: 1200 },
  { id: 11, name: 'Obinna Uche', position: 'Barman', branchId: 'ikeja', phone: '0810 338 1192', hourlyRate: 1300 },
  { id: 12, name: 'Bisi Coker', position: 'Cashier', branchId: 'ikeja', phone: '0905 771 0083', hourlyRate: 1100 },
  { id: 13, name: 'Femi Lawal', position: 'Head chef', branchId: 'vi', phone: '0802 556 9120', hourlyRate: 2600 },
  { id: 14, name: 'Zainab Sule', position: 'Waiter', branchId: 'vi', phone: '0813 908 4471', hourlyRate: 1250 },
  { id: 15, name: 'Ifeanyi Obi', position: 'Kitchen porter', branchId: 'vi', phone: '0706 114 5528', hourlyRate: 1000 },
  { id: 16, name: 'Yemi Adebayo', position: 'Supervisor', branchId: 'vi', phone: '0809 447 3360', hourlyRate: 2000 },
];

/** Weekly pattern per staff id: [ISO weekday, start, end] */
const patterns: Record<number, Array<[number, string, string]>> = {
  1: [1, 2, 3, 4, 5, 6].map((d) => [d, '10:00', '18:00']),
  2: [2, 3, 4, 5, 6].map((d) => [d, '12:00', '21:00']),
  3: [3, 4, 5, 6, 7].map((d) => [d, '11:00', '19:00']),
  4: [
    [1, '14:00', '22:00'],
    [2, '14:00', '22:00'],
    [3, '14:00', '22:00'],
    [6, '22:00', '06:00'],
    [7, '22:00', '06:00'],
  ],
  5: [1, 3, 4].map((d) => [d, '09:00', '17:00']),
  6: [5, 6].map((d) => [d, '17:15', '22:00']),
  7: [4, 5, 6, 7].map((d) => [d, '15:00', '23:00']),
  8: [1, 2, 3, 4, 5].map((d) => [d, '09:00', '17:00']),
  9: [2, 3, 4, 5, 6].map((d) => [d, '12:00', '20:00']),
  10: [1, 3, 5, 6, 7].map((d) => [d, '11:00', '19:00']),
  11: [4, 5, 6, 7].map((d) => [d, '16:00', '00:00']),
  12: [1, 2, 3, 4].map((d) => [d, '10:00', '18:00']),
  13: [1, 2, 3, 4, 5, 6].map((d) => [d, '09:30', '17:30']),
  14: [2, 4, 5, 6, 7].map((d) => [d, '12:00', '20:00']),
  15: [1, 2, 3, 4, 5].map((d) => [d, '22:00', '06:00']),
  16: [1, 2, 3, 4, 5].map((d) => [d, '10:00', '18:00']),
};

const availability: Availability[] = [
  { staffId: 3, unavailableDays: [7], note: 'Church on Sundays, can only do evenings in an emergency' },
  { staffId: 5, unavailableDays: [3], note: 'Lectures at UNILAG on Wednesdays' },
  { staffId: 10, unavailableDays: [2], note: '' },
  { staffId: 14, unavailableDays: [1], note: 'School run on Mondays' },
];

function buildUsers(): User[] {
  const users: User[] = [
    { username: 'manager.lekki', name: 'Adaeze Okafor', role: 'manager', branchId: 'lekki', passwordHash: '' },
    { username: 'manager.ikeja', name: 'Babatunde Cole', role: 'manager', branchId: 'ikeja', passwordHash: '' },
    { username: 'manager.vi', name: 'Rita Etim', role: 'manager', branchId: 'vi', passwordHash: '' },
    { username: 'hr.funmi', name: 'Funmilayo Adebayo', role: 'hr', passwordHash: '' },
  ];
  for (const member of staff) {
    users.push({
      username: member.name.split(' ')[0].toLowerCase(),
      name: member.name,
      role: 'staff',
      branchId: member.branchId,
      staffId: member.id,
      passwordHash: '',
    });
  }
  const hash = hashPassword(DEMO_PASSWORD);
  return users.map((u) => ({ ...u, passwordHash: hash }));
}

export function buildSeed(now = new Date()): Database {
  const thisWeek = weekStart(todayInLagos(now));
  const shifts: Shift[] = [];
  let id = 0;

  for (const offset of [-7, 0, 7]) {
    const monday = addDays(thisWeek, offset);
    for (const member of staff) {
      for (const [day, start, end] of patterns[member.id]) {
        shifts.push({
          id: ++id,
          branchId: member.branchId,
          staffId: member.id,
          date: addDays(monday, day - 1),
          start,
          end,
          position: member.position,
          note: '',
        });
      }
    }
    shifts.push(
      { id: ++id, branchId: 'lekki', staffId: null, date: addDays(monday, 5), start: '18:00', end: '23:00', position: 'Waiter', note: 'Saturday rush cover' },
      { id: ++id, branchId: 'ikeja', staffId: null, date: addDays(monday, 4), start: '17:00', end: '23:00', position: 'Waiter', note: '' },
    );
  }

  const find = (staffId: number, date: string) => shifts.find((s) => s.staffId === staffId && s.date === date)!;
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
  const lastWeek = addDays(thisWeek, -7);
  const nextWeek = addDays(thisWeek, 7);

  // Ngozi gave last Wednesday's shift to Funke.
  const covered = find(3, addDays(lastWeek, 2));
  covered.staffId = 6;

  const swaps: SwapRequest[] = [
    {
      id: 1, shiftId: covered.id, fromStaffId: 3, toStaffId: 6, reason: 'Family wedding in Enugu',
      status: 'approved', createdAt: hoursAgo(150), decidedAt: hoursAgo(140), decidedBy: 'Adaeze Okafor',
    },
    {
      id: 2, shiftId: find(7, addDays(lastWeek, 6)).id, fromStaffId: 7, toStaffId: 2, reason: 'Football match',
      status: 'declined', createdAt: hoursAgo(98), decidedAt: hoursAgo(90), decidedBy: 'Adaeze Okafor',
    },
    {
      id: 3, shiftId: find(2, addDays(nextWeek, 5)).id, fromStaffId: 2, toStaffId: 3, reason: 'Hospital appointment for my mum',
      status: 'pending', createdAt: hoursAgo(30),
    },
    {
      id: 4, shiftId: find(10, addDays(nextWeek, 4)).id, fromStaffId: 10, toStaffId: 12, reason: 'Visa interview',
      status: 'pending', createdAt: hoursAgo(20),
    },
    {
      id: 5, shiftId: find(1, addDays(nextWeek, 0)).id, fromStaffId: 1, toStaffId: 2, reason: "My daughter's naming ceremony",
      status: 'pending', createdAt: hoursAgo(3),
    },
  ];

  return {
    seededAt: now.toISOString(),
    branches,
    staff: staff.map((s) => ({ ...s })),
    users: buildUsers(),
    shifts,
    swaps,
    availability: availability.map((a) => ({ ...a, unavailableDays: [...a.unavailableDays] })),
    activity: [
      { at: hoursAgo(140), actor: 'Adaeze Okafor', message: 'approved the swap from Ngozi Eze to Funke Adeyemi' },
      { at: hoursAgo(90), actor: 'Adaeze Okafor', message: 'declined the swap from Musa Ibrahim to Emeka Nwosu' },
    ],
    sequences: { shift: id, swap: swaps.length },
  };
}
