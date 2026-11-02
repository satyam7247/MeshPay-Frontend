import { apiClient } from './apiClient';

export const privacyAccountService={
  get() { return apiClient.get('/api/privacy-account'); },
  update(value) { return apiClient.put('/api/privacy-account',value); },
  devices() { return apiClient.get('/api/privacy-account/devices'); },
  registerDevice(password,identity) { return apiClient.post('/api/privacy-account/devices/register',{...identity,password}); },
  revokeDevice(deviceId) { return apiClient.delete(`/api/privacy-account/devices/${encodeURIComponent(deviceId)}`); },
  lock() { return apiClient.post('/api/privacy-account/lock',{confirmed:true}); },
  unlock(password) { return apiClient.post('/api/privacy-account/unlock',{password}); },
  syncStatus() { return apiClient.get('/api/privacy-account/sync-status'); },
};
