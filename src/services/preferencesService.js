import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'meshpay.preferences.v1';
const DEFAULTS = { theme: 'light', notificationsEnabled: false, notificationSoundEnabled: true };
const THEMES = ['light', 'ocean', 'lavender', 'dark'];

export const preferencesService = {
  async load() {
    try {
      const raw = Platform.OS === 'web'
        ? (typeof window === 'undefined' ? null : window.localStorage.getItem(KEY))
        : await SecureStore.getItemAsync(KEY);
      const saved = raw ? JSON.parse(raw) : {};
      return {
        // Older installs used "system"; migrate them to the explicit light preset.
        theme: THEMES.includes(saved.theme) ? saved.theme : DEFAULTS.theme,
        notificationsEnabled: Boolean(saved.notificationsEnabled),
        notificationSoundEnabled: saved.notificationSoundEnabled !== false,
      };
    } catch {
      return { ...DEFAULTS };
    }
  },

  async save(value) {
    const serialized = JSON.stringify({
      theme: THEMES.includes(value.theme) ? value.theme : DEFAULTS.theme,
      notificationsEnabled: Boolean(value.notificationsEnabled),
      notificationSoundEnabled: value.notificationSoundEnabled !== false,
    });
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return false;
      window.localStorage.setItem(KEY, serialized);
      return true;
    }
    await SecureStore.setItemAsync(KEY, serialized);
    return true;
  },
};
