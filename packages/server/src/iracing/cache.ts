import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const CACHE_DIR = resolve(process.cwd(), 'data', 'iracing-cache');

function getNextTuesday(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilTuesday = (2 - day + 7) % 7 || 7;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntilTuesday);
  next.setUTCHours(12, 0, 0, 0);
  return next;
}

function cacheFilePath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return resolve(CACHE_DIR, `${safe}.json`);
}

interface CacheEntry<T> {
  data: T;
  cachedAt: string;
  expiresAt: string;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await readFile(cacheFilePath(key), 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (new Date(entry.expiresAt) < new Date()) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const entry: CacheEntry<T> = {
    data,
    cachedAt: new Date().toISOString(),
    expiresAt: getNextTuesday().toISOString(),
  };
  await writeFile(cacheFilePath(key), JSON.stringify(entry), 'utf-8');
}

export async function getCachedOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<{ data: T; fromCache: boolean }> {
  const cached = await getCached<T>(key);
  if (cached) return { data: cached, fromCache: true };

  const data = await fetcher();
  await setCache(key, data);
  return { data, fromCache: false };
}
