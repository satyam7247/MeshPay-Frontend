import { apiClient } from './apiClient';

export const bankAccountsService = {
  async integrationStatus() {
    if (!apiClient.isConfigured) throw new Error('Backend URL is not configured.');
    return apiClient.get('/api/integrations/status');
  },
  async list() {
    if (!apiClient.isConfigured) throw new Error('Bank account service is not connected.');
    return apiClient.get('/api/bank-accounts/my-accounts');
  },
  async sendOtp(mobile, challengeId) {
    if (!apiClient.isConfigured) throw new Error('Bank account service is not connected.');
    return apiClient.post('/api/bank-accounts/send-otp', { mobile, ...(challengeId ? { challengeId } : {}) }, { timeoutMs:20000 });
  },
  async verifyOtp(challengeId, otp) {
    if (!apiClient.isConfigured) throw new Error('Bank account service is not connected.');
    return apiClient.post('/api/bank-accounts/verify-otp', { challengeId, otp }, { timeoutMs:20000 });
  },
  async link(details) {
    if (!apiClient.isConfigured) throw new Error('Bank account service is not connected.');
    return apiClient.post('/api/bank-accounts/link', details, { timeoutMs:20000 });
  },
  async verify(accountId, accountNumber, ifsc) {
    if (!apiClient.isConfigured) throw new Error('Bank account service is not connected.');
    return apiClient.post('/api/bank-accounts/verify', { accountId, accountNumber, ifsc }, { timeoutMs:35000 });
  },
  async remove(accountId) {
    if (!apiClient.isConfigured) throw new Error('Bank account service is not connected.');
    return apiClient.delete(`/api/bank-accounts/${encodeURIComponent(accountId)}`);
  },
  async checkBalance() {
    if (!apiClient.isConfigured) throw new Error('Bank balance service is not connected.');
    return apiClient.get('/api/bank-accounts/balance');
  },
};