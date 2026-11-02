import { apiClient } from './apiClient';
export const contactsService = {
  async list() { if (apiClient.isConfigured) return apiClient.get('/api/contacts'); return []; },
};
