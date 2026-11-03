import { Injectable } from '@nestjs/common';
import { StoreService } from '../store/store.service';
import type { ActivityEntry } from '../store/types';

const KEEP = 500;

/** The "Recent activity" feed managers see under the rota. */
@Injectable()
export class ActivityService {
  constructor(private readonly store: StoreService) {}

  async record(actor: string, message: string): Promise<void> {
    const { activity } = this.store.db;
    activity.push({ at: new Date().toISOString(), actor, message });
    if (activity.length > KEEP) activity.splice(0, activity.length - KEEP);
    await this.store.flush();
  }

  recent(limit = 8): ActivityEntry[] {
    return this.store.db.activity.slice(-limit).reverse();
  }
}
