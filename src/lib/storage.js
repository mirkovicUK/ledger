import { get, set, del } from 'idb-keyval';
import { AppStateSchema, ExportPayloadSchema } from './types.js';

const STATE_KEY = 'ledger-app-state';

/** Persist full app state */
export async function saveState(state) {
  await set(STATE_KEY, JSON.parse(JSON.stringify(state)));
}

/** Load persisted state, returns null if missing/corrupted */
export async function loadState() {
  try {
    const raw = await get(STATE_KEY);
    if (!raw) return null;
    return AppStateSchema.parse(raw);
  } catch {
    return null;
  }
}

/** Clear all persisted data */
export async function clearState() {
  await del(STATE_KEY);
}

/**
 * Serialize state into ExportPayload JSON string.
 */
export function exportToJSON(state) {
  const payload = {
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
export function importFromJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = ExportPayloadSchema.parse(parsed);
    return { success: true, data: validated.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
