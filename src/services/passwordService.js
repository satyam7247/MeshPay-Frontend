import { apiClient } from './apiClient';

export const passwordService = {
  change(currentPassword,newPassword) {
    return apiClient.post('/api/password/change',{currentPassword,newPassword});
  },
  requestForgot(email) {
    return apiClient.post('/api/password/forgot/request',{email});
  },
  requestChangeOtp() {
    return apiClient.post('/api/password/change/request-otp',{});
  },
  verifyOtp(challengeId,code) {
    return apiClient.post('/api/password/otp/verify',{challengeId,code});
  },
  reset(challengeId,resetToken,newPassword) {
    return apiClient.post('/api/password/reset',{challengeId,resetToken,newPassword});
  },
};
