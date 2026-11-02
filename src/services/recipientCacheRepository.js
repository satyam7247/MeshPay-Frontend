import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { normalizeMobileNumber } from './recipientModels';
import { openLocalDatabase } from './openLocalDatabase';

const SALT_KEY = 'meshpay.recipient-cache-salt.v1';
const DATABASE_NAME = 'meshpay-recipient-cache.db';
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
let databasePromise;
let saltPromise;

async function database() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const { db } = await openLocalDatabase(DATABASE_NAME, database => database.execAsync(`
        CREATE TABLE IF NOT EXISTS saved_recipients (
          owner_id TEXT NOT NULL,
          lookup_key TEXT NOT NULL,
          recipient_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          meshpay_id TEXT,
          data_source TEXT NOT NULL,
          verification_status TEXT NOT NULL,
          record_version INTEGER NOT NULL,
          updated_at TEXT,
          last_synced_at TEXT NOT NULL,
          PRIMARY KEY (owner_id, lookup_key),
          UNIQUE (owner_id, recipient_id)
        );
        CREATE TABLE IF NOT EXISTS recipient_sync_metadata (
          owner_id TEXT PRIMARY KEY NOT NULL,
          last_successful_sync_at TEXT NOT NULL,
          record_count INTEGER NOT NULL
        );
      `));
      return db;
    })();
  }
  return databasePromise;
}

async function salt() {
  if (!saltPromise) {
    saltPromise = (async () => {
      let value = Platform.OS === 'web'
        ? (typeof window === 'undefined' ? null : window.localStorage.getItem(SALT_KEY))
        : await SecureStore.getItemAsync(SALT_KEY);
      if (!value) {
        const bytes = await Crypto.getRandomBytesAsync(32);
        value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        if (Platform.OS === 'web') {
          if (typeof window === 'undefined') throw new Error('Recipient cache storage is unavailable.');
          window.localStorage.setItem(SALT_KEY, value);
        } else {
          await SecureStore.setItemAsync(SALT_KEY, value);
        }
      }
      return value;
    })().catch(error => {
      saltPromise = null;
      throw error;
    });
  }
  return saltPromise;
}

async function lookupKey(mobileNumber) {
  const keySalt = await salt();
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${keySalt}:${mobileNumber}`);
}

function mapCached(row, typedMobileNumber) {
  if (!row) return null;
  const syncedAt = row.last_synced_at;
  const isStale = !syncedAt || Date.now() - new Date(syncedAt).getTime() > STALE_AFTER_MS;
  return {
    status: 'LOCAL_CACHE_MATCH',
    source: 'LOCAL_DEVICE_CACHE',
    verificationStatus: 'NOT_VERIFIED',
    recipient: {
      id: row.recipient_id,
      mobileNumber: typedMobileNumber,
      displayName: row.display_name,
      meshPayId: row.meshpay_id,
      recordVersion: row.record_version,
      updatedAt: row.updated_at,
    },
    lastSyncedAt: syncedAt,
    isStale,
    liveVerified: false,
  };
}

function validateRecord(record) {
  if (!record || typeof record !== 'object' || !record.recipientId || !record.displayName || !record.mobileNumber) {
    throw new Error('Recipient synchronization returned an invalid record.');
  }
  if (record.verificationStatus === 'LIVE_UPI_VERIFIED') {
    throw new Error('The application directory cannot assert live UPI verification.');
  }
}

async function writeRecord(db, ownerId, record, syncedAt) {
  validateRecord(record);
  let mobileNumber;
  try { mobileNumber = normalizeMobileNumber(record.mobileNumber); }
  catch { throw new Error('Recipient synchronization returned an invalid mobile number.'); }
  const hash = await lookupKey(mobileNumber);
  await db.runAsync(
    `INSERT INTO saved_recipients (owner_id, lookup_key, recipient_id, display_name, meshpay_id, data_source, verification_status, record_version, updated_at, last_synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(owner_id, lookup_key) DO UPDATE SET
       recipient_id=excluded.recipient_id, display_name=excluded.display_name, meshpay_id=excluded.meshpay_id,
       data_source=excluded.data_source, verification_status=excluded.verification_status,
       record_version=excluded.record_version, updated_at=excluded.updated_at, last_synced_at=excluded.last_synced_at`,
    ownerId, hash, record.recipientId, record.displayName, record.meshPayId || null,
    record.source || 'APPLICATION_DATABASE', 'NOT_VERIFIED', Number(record.recordVersion) || 1,
    record.updatedAt || null, syncedAt,
  );
}

export const recipientCacheRepository = {
  async findByMobile(ownerId, mobileNumber) {
    const [db, hash] = await Promise.all([database(), lookupKey(mobileNumber)]);
    const row = await db.getFirstAsync(
      'SELECT * FROM saved_recipients WHERE owner_id = ? AND lookup_key = ?', ownerId, hash,
    );
    return mapCached(row, mobileNumber);
  },

  async save(ownerId, record, syncedAt = new Date().toISOString()) {
    const db = await database();
    await writeRecord(db, ownerId, record, syncedAt);
    return this.findByMobile(ownerId, normalizeMobileNumber(record.mobileNumber));
  },

  async replaceOwnerSnapshot(ownerId, records, syncedAt) {
    if (!ownerId || !Array.isArray(records) || records.length > 200 || !syncedAt) {
      throw new Error('Recipient synchronization returned an invalid snapshot.');
    }
    const db = await database();
    await db.withExclusiveTransactionAsync(async transaction => {
      await transaction.runAsync('DELETE FROM saved_recipients WHERE owner_id = ?', ownerId);
      for (const record of records) await writeRecord(transaction, ownerId, record, syncedAt);
      await transaction.runAsync(
        `INSERT INTO recipient_sync_metadata (owner_id, last_successful_sync_at, record_count)
         VALUES (?, ?, ?)
         ON CONFLICT(owner_id) DO UPDATE SET last_successful_sync_at=excluded.last_successful_sync_at, record_count=excluded.record_count`,
        ownerId, syncedAt, records.length,
      );
    });
    return { syncedAt, recordCount: records.length };
  },

  async lastSync(ownerId) {
    const db = await database();
    return db.getFirstAsync('SELECT last_successful_sync_at AS syncedAt, record_count AS recordCount FROM recipient_sync_metadata WHERE owner_id = ?', ownerId);
  },

  async remove(ownerId, mobileNumber) {
    const [db, hash] = await Promise.all([database(), lookupKey(mobileNumber)]);
    await db.runAsync('DELETE FROM saved_recipients WHERE owner_id = ? AND lookup_key = ?', ownerId, hash);
  },
};

