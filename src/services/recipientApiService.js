import { apiClient } from './apiClient';

export const recipientApiService = {
  lookup(mobileNumber) {
    return apiClient.post('/api/recipients/lookup', { mobileNumber });
  },

  save(recipientId) {
    return apiClient.post('/api/recipients/saved', { recipientId });
  },

  sync() {
    return apiClient.get('/api/recipients/sync');
  },

  getDiscoverability() {
    return apiClient.get('/api/recipients/me/discoverability');
  },

  setDiscoverability(enabled) {
    return apiClient.put('/api/recipients/me/discoverability', { enabled });
  },
};

