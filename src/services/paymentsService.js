import { apiClient } from './apiClient';
export const paymentsService = {
  async prepare(payment) {
    if (!apiClient.isConfigured) throw new Error('Payment service is unavailable. Connect the backend before sending a payment.');
    return apiClient.post('/api/payments/create', payment);
  },
  async getMyQr() {
    if (!apiClient.isConfigured) throw new Error('Payment QR service is unavailable.');
    return apiClient.get('/api/payments/qr/my-qr');
  },
  async generateQr() {
    if (!apiClient.isConfigured) throw new Error('Payment QR service is unavailable.');
    return apiClient.post('/api/payments/qr/generate', {});
  },
  async status(referenceId) {
    if (!apiClient.isConfigured) throw new Error('Payment service is unavailable.');
    return apiClient.get(`/api/payments/status/${encodeURIComponent(referenceId)}`);
  },
};
