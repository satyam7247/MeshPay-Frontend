import { Linking } from 'react-native';

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

function validateAmount(value) {
  const amount = String(value ?? '').trim();
  if (!AMOUNT_PATTERN.test(amount) || Number(amount) <= 0) {
    throw new Error('Enter a valid amount greater than ₹0, with up to two decimal places.');
  }
  return amount;
}

/** Build an encoded UPI payment URI. Opening it does not prove the payment succeeded. */
export function buildUpiPaymentUri({ merchantUpiId, merchantName, amount, note = 'OfflinePayment' }) {
  const payee = String(merchantUpiId ?? '').trim();
  const name = String(merchantName ?? '').trim();
  if (!payee || !payee.includes('@') || payee.length > 255) {
    throw new Error('A valid merchant UPI ID is required.');
  }
  if (!name || name.length > 80) throw new Error('A valid merchant name is required.');
  const value = validateAmount(amount);

  return `upi://pay?pa=${encodeURIComponent(payee)}&pn=${encodeURIComponent(name)}&am=${encodeURIComponent(value)}&cu=INR&tn=${encodeURIComponent(note)}`;
}

/** Returns dispatched only after the operating system accepts the UPI URI. */
export async function launchUpiPayment(options) {
  try {
    const upiUrl = buildUpiPaymentUri(options);
    const canOpen = await Linking.canOpenURL(upiUrl);
    if (!canOpen) return { status: 'unavailable', upiUrl };
    await Linking.openURL(upiUrl);
    return { status: 'dispatched', upiUrl };
  } catch (error) {
    return { status: 'error', message: error?.message || 'Could not open a UPI payment app.' };
  }
}
