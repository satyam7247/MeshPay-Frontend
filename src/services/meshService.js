import { NativeEventEmitter, NativeModules } from 'react-native';
import { offlineTransactionLedgerService } from './offlineTransactionLedgerService';

export const BLUETOOTH_RECEIPT_PROTOCOL = 'meshpay.bluetooth.receipt.v1';
export const BLUETOOTH_RECEIPT_EVENT = 'MeshBluetoothReceipt';
export const BLUETOOTH_CONNECTION_EVENT = 'MeshDeviceConnectionChanged';
const nativeBridge = NativeModules.MeshBluetoothBridge;
const nativeBridgeSupportsEvents = Boolean(nativeBridge && typeof nativeBridge.addListener === 'function' && typeof nativeBridge.removeListeners === 'function');
let connectionState = { connected: false, devices: [] };
let bridgeListening = false;
let bridgeConnectionSubscription = null;

/**
 * The native module emits MeshBluetoothReceipt only after authenticating the
 * peer and packet, with this payload shape:
 * { protocol: BLUETOOTH_RECEIPT_PROTOCOL, status: 'CONFIRMED', customerUpiId,
 *   transaction: { bluetoothTxnId, merchantUpiId, amount, localTimestamp } }
 * This handler stores a local sync log only; it never settles a payment.
 */
export const meshService = {
  getStatus() {
    return {
      available: nativeBridgeSupportsEvents,
      listening: bridgeListening,
      connected: connectionState.connected,
      devices: connectionState.devices,
      message: connectionState.connected
        ? `${connectionState.devices.length} device${connectionState.devices.length === 1 ? '' : 's'} connected. Secure mesh link is active.`
        : 'Native Bluetooth mesh integration is not connected.',
    };
  },

  /** Initialize the native bridge once and keep its connection listener alive. */
  async initialize() {
    if (!nativeBridgeSupportsEvents) return { available: false, listening: false };
    if (typeof nativeBridge.initialize === 'function') await nativeBridge.initialize();
    else if (typeof nativeBridge.startListening === 'function') await nativeBridge.startListening();
    if (!bridgeConnectionSubscription) {
      const emitter = new NativeEventEmitter(nativeBridge);
      bridgeConnectionSubscription = emitter.addListener(BLUETOOTH_CONNECTION_EVENT, event => {
        const devices = Array.isArray(event?.devices) ? event.devices : (event?.device ? [event.device] : []);
        const connected = event?.connected === true && devices.length > 0;
        connectionState = { connected, devices: connected ? devices : [] };
      });
    }
    bridgeListening = true;
    return { available: true, listening: true };
  },

  /** Native BLE should emit this only after a real device connection changes. */
  subscribeToConnectionState(onChange) {
    if (!nativeBridgeSupportsEvents) return null;
    const emitter = new NativeEventEmitter(nativeBridge);
    return emitter.addListener(BLUETOOTH_CONNECTION_EVENT, event => {
      const devices = Array.isArray(event?.devices) ? event.devices : (event?.device ? [event.device] : []);
      const connected = event?.connected === true && devices.length > 0;
      connectionState = { connected, devices: connected ? devices : [] };
      onChange?.(this.getStatus());
    });
  },

  /** Subscribe to authenticated receipt packets from the native BLE module. */
  subscribeToReceipts(currentCustomerUpiId, { onSaved, onError } = {}) {
    if (!nativeBridgeSupportsEvents) return null;
    const emitter = new NativeEventEmitter(nativeBridge);
    return emitter.addListener(BLUETOOTH_RECEIPT_EVENT, receipt => {
      this.handleReceipt(receipt, currentCustomerUpiId)
        .then(saved => onSaved?.(saved))
        .catch(error => onError?.(error));
    });
  },

  /** Call this from the native BLE receipt callback after authenticating the sender. */
  async handleReceipt(receipt, currentCustomerUpiId) {
    if (!receipt || receipt.protocol !== BLUETOOTH_RECEIPT_PROTOCOL || receipt.status !== 'CONFIRMED') {
      throw new Error('Bluetooth receipt is not a confirmed MeshPay transaction packet.');
    }
    const tx = receipt.transaction || receipt;
    const receiptCustomerUpiId = receipt.customerUpiId || tx.customerUpiId;
    if (!currentCustomerUpiId || String(receiptCustomerUpiId || '').trim().toLowerCase() !== String(currentCustomerUpiId).trim().toLowerCase()) {
      throw new Error('Bluetooth receipt does not belong to the signed-in customer.');
    }

    return offlineTransactionLedgerService.saveOfflineTransaction({
      bluetoothTxnId: tx.bluetoothTxnId || receipt.bluetoothTxnId,
      customerUpiId: currentCustomerUpiId,
      merchantUpiId: tx.merchantUpiId,
      amount: tx.amount,
      localTimestamp: tx.localTimestamp,
    });
  },
};
