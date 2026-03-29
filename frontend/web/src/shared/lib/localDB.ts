export function readCollection<T>(key: string, fallback: T[]): T[] {
  const raw = localStorage.getItem(key);

  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return JSON.parse(raw) as T[];
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

export function writeCollection<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function generateId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
