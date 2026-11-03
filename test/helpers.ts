import { ActivityService } from '../src/activity/activity.service';
import { AvailabilityService } from '../src/availability/availability.service';
import { RotaEvents } from '../src/common/rota-events';
import { HoursService } from '../src/hours/hours.service';
import { OpenShiftsService } from '../src/shifts/open-shifts.service';
import { ShiftsService } from '../src/shifts/shifts.service';
import { StaffService } from '../src/staff/staff.service';
import { buildSeed } from '../src/store/seed-data';
import type { StoreService } from '../src/store/store.service';
import type { Database } from '../src/store/types';
import { SwapsService } from '../src/swaps/swaps.service';

/** An in-memory stand-in for the JSON file store. */
export function memoryStore(db: Database = buildSeed()): StoreService {
  return {
    db,
    nextId(kind: keyof Database['sequences']) {
      db.sequences[kind] += 1;
      return db.sequences[kind];
    },
    flush: async () => undefined,
  } as unknown as StoreService;
}

/** Wires the services together the same way the Nest modules do. */
export function services(store = memoryStore()) {
  const events = new RotaEvents();
  const activity = new ActivityService(store);
  const staff = new StaffService(store, activity);
  const availability = new AvailabilityService(store);
  const shifts = new ShiftsService(store, staff, activity, events);
  const hours = new HoursService(store, staff, events);
  const swaps = new SwapsService(store, shifts, staff, activity);
  const openShifts = new OpenShiftsService(shifts, staff, availability, activity);
  return { store, events, activity, staff, availability, shifts, hours, swaps, openShifts };
}
