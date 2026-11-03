import { Injectable, Logger } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildSeed } from './seed-data';
import type { Database } from './types';

export const DATA_FILE = resolve(process.env.SHIFTLY_DATA_FILE ?? 'data/shiftly.json');

/**
 * A small JSON file store. Everything is held in memory and written back to
 * disk after each change; writes are queued so they never overlap.
 */
@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);
  private writes: Promise<void> = Promise.resolve();
  readonly db: Database;

  constructor() {
    if (!existsSync(DATA_FILE)) {
      this.logger.log(`No data file at ${DATA_FILE}, seeding demo data`);
      writeDatabase(buildSeed());
    }
    this.db = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as Database;
  }

  nextId(kind: keyof Database['sequences']): number {
    this.db.sequences[kind] += 1;
    return this.db.sequences[kind];
  }

  /** Persist the current state. Resolves once it is on disk. */
  flush(): Promise<void> {
    const snapshot = JSON.stringify(this.db, null, 2);
    this.writes = this.writes.then(async () => {
      const tmp = `${DATA_FILE}.tmp`;
      await writeFile(tmp, snapshot);
      await rename(tmp, DATA_FILE);
    });
    return this.writes;
  }
}

export function writeDatabase(db: Database): void {
  mkdirSync(dirname(DATA_FILE), { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
