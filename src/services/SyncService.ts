import { set, get, del } from 'idb-keyval';

export interface PendingAction {
  id: string;
  timestamp: string;
  type: string;
  payload: any;
  endpoint: string; // The Supabase table or function
  retries: number;
}

const SYNC_QUEUE_KEY = 'antigravity_sync_queue';

export class SyncService {
  /**
   * Adds an action to the persistent offline queue.
   */
  static async enqueue(type: string, payload: any, endpoint: string): Promise<string> {
    const queue = await this.getQueue();
    const id = `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const action: PendingAction = {
      id,
      timestamp: new Date().toISOString(),
      type,
      payload,
      endpoint,
      retries: 0
    };
    
    queue.push(action);
    await set(SYNC_QUEUE_KEY, queue);
    return id;
  }

  /**
   * Retrieves all pending actions.
   */
  static async getQueue(): Promise<PendingAction[]> {
    const queue = await get<PendingAction[]>(SYNC_QUEUE_KEY);
    return queue || [];
  }

  /**
   * Removes an action after successful sync.
   */
  static async dequeue(id: string): Promise<void> {
    const queue = await this.getQueue();
    const next = queue.filter(a => a.id !== id);
    await set(SYNC_QUEUE_KEY, next);
  }

  /**
   * Clears the entire queue (use with caution).
   */
  static async clearQueue(): Promise<void> {
    await del(SYNC_QUEUE_KEY);
  }

  /**
   * Updates an action (e.g. increment retries).
   */
  static async updateAction(id: string, updates: Partial<PendingAction>): Promise<void> {
    const queue = await this.getQueue();
    const idx = queue.findIndex(a => a.id === id);
    if (idx !== -1) {
      queue[idx] = { ...queue[idx], ...updates };
      await set(SYNC_QUEUE_KEY, queue);
    }
  }
}
