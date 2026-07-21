import { get, set, del } from 'idb-keyval';
import type { AppState, ExportPayload } from './types.js';

const STATE_KEY = 'ledger-app-state';

/** Persist full app state */
export async function saveState(state: AppState): Promise<void> {
  await set(STATE_KEY, JSON.parse(JSON.stringify(state)));
}

/** Load persisted state, returns null if missing/corrupted */
export async function loadState(): Promise<AppState | null> {
  try {
    const raw = await get(STATE_KEY);
    if (!raw) return null;
    return (typeof raw === 'object' ? raw : JSON.parse(raw)) as AppState;
  } catch {
    return null;
  }
}

/** Clear all persisted data */
export async function clearState(): Promise<void> {
  await del(STATE_KEY);
}

/**
 * Serialize state into ExportPayload JSON string.
 */
export function exportToJSON(state: AppState): string {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Parse and validate an import payload.
 * Returns { success: true, data: AppState } | { success: false, error: string }
 */
export function importFromJSON(jsonString: string): { success: true; data: AppState } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = parsed as ExportPayload;
    if (!validated.version || !validated.exportedAt || !validated.data) {
      return { success: false, error: 'Invalid export format' };
    }
    return { success: true, data: validated.data };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}