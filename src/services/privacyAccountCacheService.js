import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function keyFor(userId) { return `meshpay.privacy-cache.v1.${userId}`; }

export const privacyAccountCacheService={
  async get(userId) {
    if(!userId)return null;
    try {
      const raw=Platform.OS==='web'
        ? (typeof window==='undefined'?null:window.localStorage.getItem(keyFor(userId)))
        : await SecureStore.getItemAsync(keyFor(userId));
      return raw?JSON.parse(raw):null;
    } catch { return null; }
  },
  async set(userId,value) {
    if(!userId||!value)return;
    const raw=JSON.stringify(value);
    if(Platform.OS==='web') {
      if(typeof window!=='undefined')window.localStorage.setItem(keyFor(userId),raw);
      return;
    }
    await SecureStore.setItemAsync(keyFor(userId),raw);
  },
};
