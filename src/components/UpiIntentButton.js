import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Button } from './UI';
import { launchUpiPayment } from '../services/upiIntentService';

/** Opens a bank/UPI app. The callback means only that the intent was dispatched. */
export function UpiIntentButton({ merchantUpiId, merchantName, amount, isDemo = false, disabled = false, onIntentDispatched, title = 'Continue in UPI app' }) {
  const [busy, setBusy] = useState(false);

  const dispatchIntent = async () => {
    if (busy || disabled) return;
    setBusy(true);
    const result = await launchUpiPayment({ merchantUpiId, merchantName, amount });
    setBusy(false);

    if (result.status === 'unavailable') {
      Alert.alert('No UPI app found', 'Install or enable a UPI payment app such as Google Pay, PhonePe, or Paytm, then try again.');
      return;
    }
    if (result.status === 'error') {
      Alert.alert('Could not open UPI app', result.message);
      return;
    }

    onIntentDispatched?.({ status: 'dispatched', dispatchedAt: new Date().toISOString() });
    Alert.alert('UPI app opened', 'Check the payment status in your UPI app. Opening the app does not confirm that money was sent.');
  };

  const openPaymentApp = () => {
    if (!isDemo) return dispatchIntent();
    Alert.alert(
      'Development UPI ID',
      `${merchantUpiId} is a demo fallback and is not verified. Continuing can open a real payment app and may result in an actual payment. Continue only with explicit test authorization.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: dispatchIntent },
      ],
    );
  };

  return <Button title={busy ? 'Opening UPI app…' : title} icon={busy ? undefined : 'open-outline'} disabled={busy || disabled} onPress={openPaymentApp} />;
}
