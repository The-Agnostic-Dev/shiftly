import { buildSeed, DEMO_PASSWORD } from './store/seed-data';
import { DATA_FILE, writeDatabase } from './store/store.service';

const db = buildSeed();
writeDatabase(db);
console.log(
  `Seeded ${db.staff.length} staff, ${db.shifts.length} shifts and ${db.swaps.length} swap requests into ${DATA_FILE}.`,
);
console.log(`Demo logins use the password "${DEMO_PASSWORD}".`);
