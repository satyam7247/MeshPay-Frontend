import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from './apiClient';
import { deviceIdentityService } from './deviceIdentityService';
import { notificationsService } from './notificationsService';

const SESSION_KEY='meshpay.session.v1';
const AUTH_REQUEST_TIMEOUT_MS=30000;
let authGeneration=0;

async function saveStoredSession(value) {
  const serialized=JSON.stringify(value);
  if (Platform.OS==='web') {
    if (typeof window==='undefined') return false;
    window.localStorage.setItem(SESSION_KEY,serialized);
    return true;
  }
  await SecureStore.setItemAsync(SESSION_KEY,serialized);
  return true;
}

async function readStoredSession() {
  if (Platform.OS==='web') {
    if (typeof window==='undefined') return null;
    return JSON.parse(window.localStorage.getItem(SESSION_KEY)||'null');
  }
  return JSON.parse(await SecureStore.getItemAsync(SESSION_KEY)||'null');
}

async function deleteStoredSession() {
  if (Platform.OS==='web') {
    if (typeof window!=='undefined') window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

async function persistSession(result) {
  try {
    return await saveStoredSession({
      token:result.token,
      user:result.user,
      deviceId:result.deviceId||null,
      savedAt:new Date().toISOString(),
    });
  } catch {
    return false;
  }
}

export const authService = {
  async login(credentials) {
    const generation=++authGeneration;
    if (!apiClient.isConfigured) throw new Error('Account service is not connected.');
    const device = await deviceIdentityService.getIdentity();
    const result = await apiClient.post('/api/auth/login', { ...credentials, ...device }, { timeoutMs:AUTH_REQUEST_TIMEOUT_MS });
    if (generation!==authGeneration) throw new Error('Sign-in was superseded. Please try again.');
    if (!result?.token || !result?.user?.id) throw new Error('Account service returned an invalid response.');
    if (result.deviceId && result.deviceId !== device.deviceId) {
      await deviceIdentityService.saveIdentity(result.deviceId);
    }
    apiClient.setAccessToken(result.token);
    const sessionSaved=await persistSession(result);
    if (!sessionSaved) {
      apiClient.setAccessToken(null);
      throw new Error('Your session could not be saved in this browser. Check browser storage settings and try again.');
    }
    return { ...result, sessionSaved };
  },

  async signup(details) {
    const generation=++authGeneration;
    if (!apiClient.isConfigured) throw new Error('Account service is not connected.');
    const device = await deviceIdentityService.getIdentity();
    const result = await apiClient.post('/api/auth/signup', { ...details, ...device }, { timeoutMs:AUTH_REQUEST_TIMEOUT_MS });
    if (generation!==authGeneration) throw new Error('Sign-in was superseded. Please try again.');
    if (!result?.token || !result?.user?.id) throw new Error('Account service returned an invalid response.');
    if (result.deviceId && result.deviceId !== device.deviceId) {
      await deviceIdentityService.saveIdentity(result.deviceId);
    }
    apiClient.setAccessToken(result.token);
    const sessionSaved=await persistSession(result);
    if (!sessionSaved) {
      apiClient.setAccessToken(null);
      throw new Error('Your session could not be saved in this browser. Check browser storage settings and try again.');
    }
    return { ...result, sessionSaved };
  },

  async restoreSession() {
    const generation=authGeneration;
    let saved;
    try { saved=await readStoredSession(); } catch { saved=null; }
    if (generation!==authGeneration) return null;
    if (!saved?.token || !saved?.user?.id) return null;
    apiClient.setAccessToken(saved.token);
    try {
      const user=await apiClient.get('/api/auth/me');
      if (generation!==authGeneration) return null;
      if (!user?.id) throw new Error('Invalid profile response.');
      const result={ token:saved.token, user, offline:false, sessionSaved:true };
      await persistSession(result);
      return result;
    } catch (error) {
      if (generation!==authGeneration) return null;
      if (error?.status===401) {
        apiClient.setAccessToken(null);
        await deleteStoredSession();
        return null;
      }
      return { ...saved, offline:true, sessionSaved:true };
    }
  },

  async logout() {
    ++authGeneration;
    try { await notificationsService.registerPushToken(false); } catch {}
    const tokenPresent=true;
    try {
      if (tokenPresent) await apiClient.post('/api/auth/logout', {});
    } catch {}
    apiClient.setAccessToken(null);
    await deleteStoredSession().catch(()=>{});
  },
};
