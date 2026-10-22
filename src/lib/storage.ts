import { fromJSON, toJSON } from "./io";
import type { Assessment } from "./model";

const KEY = "ai-governance-toolkit:draft:v1";

/** Browser storage can be missing, full or blocked; the app must work without it. */
export function loadDraft(storage: Pick<Storage, "getItem"> | undefined = safeStorage()): Assessment | null {
  try {
    const raw = storage?.getItem(KEY);
    return raw ? fromJSON(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(a: Assessment, storage: Pick<Storage, "setItem"> | undefined = safeStorage()): boolean {
  try {
    storage?.setItem(KEY, toJSON(a));
    return storage !== undefined;
  } catch {
    return false;
  }
}

export function clearDraft(storage: Pick<Storage, "removeItem"> | undefined = safeStorage()): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}
