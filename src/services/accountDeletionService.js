import { apiClient } from './apiClient';

export const accountDeletionService = {
  sendOtp(previousChallengeId=null) {
    return apiClient.post('/api/account-deletion/otp', { previousChallengeId });
  },
  verifyAndRequest(challengeId, code) {
    return apiClient.post('/api/account-deletion/verify', { challengeId, code });
  },
  status() {
    return apiClient.get('/api/account-deletion/status');
  },
};
