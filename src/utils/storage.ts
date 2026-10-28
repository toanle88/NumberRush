export const readStorage = (key: string): string | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string): boolean => {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const removeStorage = (key: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable or full; in-memory state remains authoritative.
  }
};

export const readStoredNonNegativeInteger = (key: string, fallback = 0, maximum = Number.MAX_SAFE_INTEGER): number => {
  const raw = readStorage(key)?.trim() ?? '';
  if (!/^\d+$/.test(raw)) return fallback;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 && value <= maximum ? value : fallback;
};
