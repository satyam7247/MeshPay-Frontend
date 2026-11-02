import { apiClient } from './apiClient';
import { openLocalDatabase } from './openLocalDatabase';

const DATABASE_NAME = 'meshpay-offline-transactions.db';
let dbPromise;
let persistentStorage = true;

function localDateTime(value) {
  if (value == null || value === '') throw new Error('The Bluetooth transaction timestamp is required.');
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Transaction timestamp is invalid.');
  const pad = part => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${String(date.getMilliseconds()).padStart(3, '0')}`;
}

async function database() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const opened = await openLocalDatabase(DATABASE_NAME, db => db.execAsync(`
        CREATE TABLE IF NOT EXISTS local_transactions (
          bluetooth_id TEXT PRIMARY KEY NOT NULL,
          customer_upi_id TEXT NOT NULL,
          merchant_upi_id TEXT NOT NULL,
          amount REAL NOT NULL,
          amount_decimal TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          is_synced INTEGER NOT NULL DEFAULT 0 CHECK (is_synced IN (0, 1))
        );
      `));
      persistentStorage = opened.persistent;
      return opened.db;
    })().catch(error => { dbPromise = null; throw error; });
  }
  return dbPromise;
}

function validateTransaction(input) {
  const bluetoothTxnId = String(input?.bluetoothTxnId ?? '').trim();
  const customerUpiId = String(input?.customerUpiId ?? '').trim();
  const merchantUpiId = String(input?.merchantUpiId ?? '').trim();
  const amount = String(input?.amount ?? '').trim();
  const timestamp = localDateTime(input?.localTimestamp);

  if (!bluetoothTxnId || bluetoothTxnId.length > 128) throw new Error('Bluetooth transaction ID is invalid.');
  if (!customerUpiId || customerUpiId.length > 80 || !merchantUpiId || merchantUpiId.length > 255) {
    throw new Error('Customer and merchant UPI IDs are required.');
  }
  if (!/^(?:0|[1-9]\d{0,16})(?:\.\d{1,2})?$/.test(amount) || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    throw new Error('Transaction amount must be positive and have no more than two decimal places.');
  }
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) throw new Error('Transaction timestamp is invalid.');
  return { bluetoothTxnId, customerUpiId, merchantUpiId, amount, timestamp };
}

export const offlineTransactionLedgerService = {
  /** Reports the local ledger's real storage capabilities for the diagnostics UI. */
  async getDiagnostics() {
    await database();
    return { storageActive: true, storagePersistent: persistentStorage, encryptionEnabled: false };
  },

  /** Call only after the native Bluetooth layer confirms receipt of its packet. */
  async saveOfflineTransaction(input) {
    const value = validateTransaction(input);
    const db = await database();
    await db.withExclusiveTransactionAsync(async tx => {
      await tx.runAsync(
        `INSERT INTO local_transactions (bluetooth_id, customer_upi_id, merchant_upi_id, amount, amount_decimal, timestamp, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        value.bluetoothTxnId, value.customerUpiId, value.merchantUpiId, Number(value.amount), value.amount, value.timestamp,
      );
    });
    return { ...value, isSynced: false };
  },

  async getUnsyncedTransactions(customerUpiId) {
    const db = await database();
    const rows = customerUpiId
      ? await db.getAllAsync('SELECT bluetooth_id AS bluetoothTxnId, customer_upi_id AS customerUpiId, merchant_upi_id AS merchantUpiId, amount_decimal AS amount, timestamp AS localTimestamp FROM local_transactions WHERE is_synced = 0 AND customer_upi_id = ? ORDER BY timestamp ASC', String(customerUpiId))
      : await db.getAllAsync('SELECT bluetooth_id AS bluetoothTxnId, customer_upi_id AS customerUpiId, merchant_upi_id AS merchantUpiId, amount_decimal AS amount, timestamp AS localTimestamp FROM local_transactions WHERE is_synced = 0 ORDER BY timestamp ASC');
    return rows;
  },

  async markAsSynced(bluetoothIds) {
    if (!Array.isArray(bluetoothIds) || bluetoothIds.length === 0) return 0;
    const ids = [...new Set(bluetoothIds.map(value => String(value).trim()).filter(Boolean))];
    if (!ids.length) return 0;
    const db = await database();
    let updated = 0;
    await db.withExclusiveTransactionAsync(async tx => {
      for (const id of ids) {
        const result = await tx.runAsync('UPDATE local_transactions SET is_synced = 1 WHERE bluetooth_id = ? AND is_synced = 0', id);
        updated += result.changes;
      }
    });
    return updated;
  },

  /** Sync is atomic and idempotent; pending rows remain pending on any failure. */
  async syncPendingTransactions(customerUpiId) {
    if (!customerUpiId) return { syncedCount: 0, reason: 'customer-account-unavailable' };
    if (!apiClient.isConfigured || !apiClient.hasAccessToken) return { syncedCount: 0, reason: 'backend-or-session-unavailable' };
    const pending = await this.getUnsyncedTransactions(customerUpiId);
    if (!pending.length) return { syncedCount: 0, reason: 'nothing-to-sync' };

    const response = await apiClient.post('/api/transactions/sync', pending);
    const acknowledged = Array.isArray(response?.syncedIds) ? response.syncedIds : [];
    const submitted = new Set(pending.map(item => item.bluetoothTxnId));
    const safeIds = acknowledged.filter(id => submitted.has(id));
    if (safeIds.length !== pending.length) throw new Error('The server did not acknowledge every offline transaction. Pending records were kept for retry.');
    const syncedCount = await this.markAsSynced(safeIds);
    return { syncedCount, reason: 'synced' };
  },
};
