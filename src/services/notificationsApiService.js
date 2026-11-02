import { apiClient } from './apiClient';

export const notificationsApiService={
  list(page=0,size=50) {
    return apiClient.get(`/api/notifications?page=${page}&size=${size}`);
  },
  unreadCount() {
    return apiClient.get('/api/notifications/unread-count');
  },
  markRead(id) {
    return apiClient.put(`/api/notifications/${encodeURIComponent(id)}/read`,{});
  },
  markAllRead() {
    return apiClient.put('/api/notifications/read-all',{});
  },
  remove(id) {
    return apiClient.delete(`/api/notifications/${encodeURIComponent(id)}`);
  },
  savePushToken(expoPushToken,enabled,soundEnabled) {
    return apiClient.put('/api/notifications/push-token',{expoPushToken,enabled,soundEnabled});
  },
};
