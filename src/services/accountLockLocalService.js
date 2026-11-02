import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY='meshpay.account-lock.v1';

async function read() {
  const raw=Platform.OS==='web'
    ? (typeof window==='undefined'?null:window.localStorage.getItem(KEY))
    : await SecureStore.getItemAsync(KEY);
  return raw?JSON.parse(raw):null;
}

async function write(value) {
  const raw=JSON.stringify(value);
  if (Platform.OS==='web') {
    if (typeof window==='undefined') throw new Error('Device storage is unavailable.');
    window.localStorage.setItem(KEY,raw);
  } else await SecureStore.setItemAsync(KEY,raw);
}

export const accountLockLocalService={
  async get(userId) {
    const current=await read();
    return current?.userId===userId?current:{locked:false,pendingSync:false};
  },
  async lock(userId,pendingSync=true) {
    await write({userId,locked:true,pendingSync,updatedAt:new Date().toISOString()});
  },
  async markSynchronized(userId) {
    await write({userId,locked:true,pendingSync:false,updatedAt:new Date().toISOString()});
  },
  async unlock(userId) {
    const current=await read();
    if (current?.userId===userId) {
      if (Platform.OS==='web') window.localStorage.removeItem(KEY);
      else await SecureStore.deleteItemAsync(KEY);
    }
  },
};
