import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

/**
 * Open a persistent app database where the platform supports it. Expo SQLite's
 * browser OPFS pool is limited; use a shared in-memory DB if that pool is full
 * so the web preview remains usable without claiming browser persistence.
 */
export async function openLocalDatabase(name, initialize) {
  let db;
  // The Expo web preview uses OPFS access handles with a small fixed pool.
  // Metro Fast Refresh can leave those handles occupied, producing a WASM
  // "cannot create file" console error before the existing memory fallback.
  // Keep development previews session-only; native builds still use durable
  // SQLite, and production web can still attempt persistent SQLite below.
  if (Platform.OS === 'web' && __DEV__) {
    db = await SQLite.openDatabaseAsync(':memory:');
    await initialize(db);
    return { db, persistent: false };
  }

  try {
    db = await SQLite.openDatabaseAsync(name);
    await db.execAsync(Platform.OS === 'web' ? 'PRAGMA journal_mode = DELETE;' : 'PRAGMA journal_mode = WAL;');
    await initialize(db);
    return { db, persistent: true };
  } catch (error) {
    if (Platform.OS !== 'web') throw error;
    await db?.closeAsync().catch(() => {});

    // The fallback uses the same shared SQLite in-memory connection in this
    // Expo web worker. It lasts only for the current browser session.
    db = await SQLite.openDatabaseAsync(':memory:');
    await initialize(db);
    console.warn(`Persistent browser SQLite unavailable for ${name}; using temporary in-memory storage for this session.`);
    return { db, persistent: false };
  }
}
