import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';

const cacheKey=userId=>`meshpay.app-lock.v1.${userId}`;

async function readCache(userId) {
  try {
    const raw=Platform.OS==='web'
      ?(typeof window==='undefined'?null:window.localStorage.getItem(cacheKey(userId)))
      :await SecureStore.getItemAsync(cacheKey(userId));
    return raw?JSON.parse(raw):null;
  } catch { return null; }
}

async function writeCache(userId,value) {
  const raw=JSON.stringify({enabled:Boolean(value.enabled),type:value.type||null});
  if(Platform.OS==='web') {
    if(typeof window!=='undefined')window.localStorage.setItem(cacheKey(userId),raw);
    return;
  }
  await SecureStore.setItemAsync(cacheKey(userId),raw);
}

async function clearCache(userId) {
  if(Platform.OS==='web') {
    if(typeof window!=='undefined')window.localStorage.removeItem(cacheKey(userId));
    return;
  }
  await SecureStore.deleteItemAsync(cacheKey(userId));
}

export const appLockService={
  cached:userId=>readCache(userId),
  async status(userId) {
    const value=await apiClient.get('/api/app-lock');
    await writeCache(userId,value);
    return value;
  },
  async enable(passwordType,password,userId) {
    const value=await apiClient.post('/api/app-lock/enable',{passwordType,password});
    await writeCache(userId,value);
    return value;
  },
  verify(password) { return apiClient.post('/api/app-lock/verify',{password}); },
  lockSession() { return apiClient.post('/api/app-lock/lock',{}); },
  async disable(password,userId) {
    const value=await apiClient.post('/api/app-lock/disable',{password});
    await clearCache(userId);
    return value;
  },
  requestResetOtp() { return apiClient.post('/api/app-lock/forgot/request',{}); },
  verifyResetOtp(challengeId,code) { return apiClient.post('/api/app-lock/forgot/verify',{challengeId,code}); },
  async reset(challengeId,resetToken,passwordType,password,userId) {
    const value=await apiClient.post('/api/app-lock/forgot/reset',{challengeId,resetToken,passwordType,password});
    await writeCache(userId,value);
    return value;
  },
};
