import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_KEY='meshpay.device-id.v1';

function newDeviceId() {
  if (typeof Crypto.randomUUID === 'function') return Crypto.randomUUID();
  const bytes=Crypto.getRandomBytes(16);
  bytes[6]=(bytes[6]&0x0f)|0x40;
  bytes[8]=(bytes[8]&0x3f)|0x80;
  const hex=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

async function loadId() {
  if (Platform.OS==='web') return typeof window==='undefined'?null:window.localStorage.getItem(DEVICE_KEY);
  return SecureStore.getItemAsync(DEVICE_KEY);
}

async function saveId(value) {
  if (Platform.OS==='web') {
    if (typeof window==='undefined') throw new Error('Device storage is unavailable.');
    window.localStorage.setItem(DEVICE_KEY,value);
    return;
  }
  await SecureStore.setItemAsync(DEVICE_KEY,value);
}

export const deviceIdentityService={
  async saveIdentity(deviceId) {
    if (typeof deviceId !== 'string' || !deviceId) return;
    await saveId(deviceId);
  },
  async getIdentity() {
    let deviceId=await loadId();
    if (!deviceId) {
      deviceId=newDeviceId();
      await saveId(deviceId);
    }
    const platform=Platform.OS==='web'?'web':Platform.OS==='ios'?'ios':Platform.OS==='android'?'android':'unknown';
    const browserName=Platform.OS==='web'&&typeof navigator!=='undefined'
      ? (navigator.userAgentData?.platform||navigator.platform||'Browser')
      : `${Platform.OS} device`;
    return {deviceId,deviceName:String(browserName).slice(0,80),platform};
  },
};
