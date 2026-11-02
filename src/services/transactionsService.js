import { apiClient } from './apiClient';
export const transactionsService = {
  async list(currentUpiId) {
    if (!apiClient.isConfigured) throw new Error('Transaction service is unavailable.');
    const transactions = await apiClient.get('/api/transactions/my-transactions');
    return transactions.map(item => {
      const sent = item.direction ? item.direction === 'SENT' : item.senderVpa === currentUpiId;
      return {
        ...item,
        contact: item.detailsHidden ? 'Transaction details hidden' : (sent ? item.receiverVpa : item.senderVpa),
        direction: sent ? 'Sent' : 'Received',
        date: item.settledAt ? new Date(item.settledAt).toLocaleString() : '',
        status: item.settlementType==='INTERNAL_SIMULATOR_LEDGER'
          ? 'Internal demo ledger — not bank-settled'
          : item.status,
      };
    });
  },
};
