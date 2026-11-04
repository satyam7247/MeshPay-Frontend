import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApiService } from './notificationsApiService';

let soundEnabled=true;
let registeredToken=null;
let handlerInstalled=false;
let pushRegistrationTask=null;

function nativePushSupported() {
  return Platform.OS==='ios'||Platform.OS==='android';
}

function browserNotifications() {
  return Platform.OS==='web'&&typeof window!=='undefined'&&'Notification' in window
    ?window.Notification:null;
}

function installHandler() {
  if(!nativePushSupported()||handlerInstalled)return;
  Notifications.setNotificationHandler({
    handleNotification:async()=>({
      shouldShowBanner:true,
      shouldShowList:true,
      shouldPlaySound:soundEnabled,
      shouldSetBadge:true,
    }),
  });
  handlerInstalled=true;
}

function projectId() {
  return Constants.expoConfig?.extra?.eas?.projectId||Constants.easConfig?.projectId||null;
}

installHandler();

export const notificationsService={
  isSupported() { return nativePushSupported()||Boolean(browserNotifications()); },

  async getPermission() {
    if(nativePushSupported()) {
      try { return (await Notifications.getPermissionsAsync()).status; }
      catch { return 'unsupported'; }
    }
    return browserNotifications()?.permission||'unsupported';
  },

  async requestPermission() {
    if(nativePushSupported()) {
      let permissions=await Notifications.getPermissionsAsync();
      if(permissions.status!=='granted')permissions=await Notifications.requestPermissionsAsync();
      return permissions.status;
    }
    const BrowserNotification=browserNotifications();
    if(!BrowserNotification)return 'unsupported';
    if(BrowserNotification.permission==='granted'||BrowserNotification.permission==='denied')return BrowserNotification.permission;
    return BrowserNotification.requestPermission();
  },

  setSoundEnabled(enabled) {
    soundEnabled=Boolean(enabled);
    installHandler();
  },

  async registerPushToken(enabled,soundOn=soundEnabled) {
    soundEnabled=Boolean(soundOn);
    if(!nativePushSupported())return {registered:false,reason:'native-push-unavailable'};
    if(pushRegistrationTask){
      const pending=pushRegistrationTask;
      if(enabled)return pending;
      await pending.catch(()=>{});
      if(pushRegistrationTask)return this.registerPushToken(false,soundEnabled);
    }
    pushRegistrationTask=(async()=>{
      if(!enabled&&registeredToken) {
        await notificationsApiService.savePushToken(registeredToken,false,soundEnabled);
        return {registered:true,enabled:false};
      }
      const permission=await this.getPermission();
      if(permission!=='granted')return {registered:false,reason:'permission-not-granted'};
      const easProjectId=projectId();
      if(!easProjectId)throw new Error('Set EXPO_PUBLIC_EAS_PROJECT_ID and configure Expo push credentials before enabling mobile push delivery.');
      if(Platform.OS==='android') {
        await Notifications.setNotificationChannelAsync('payments',{
          name:'Payments',importance:Notifications.AndroidImportance.HIGH,
          vibrationPattern:[0,250,150,250],lightColor:'#C83E50',sound:soundEnabled?'default':null,
        });
      }
      if(!registeredToken) {
        const tokenInfo=await Notifications.getExpoPushTokenAsync({projectId:easProjectId});
        registeredToken=tokenInfo.data;
      }
      await notificationsApiService.savePushToken(registeredToken,Boolean(enabled),soundEnabled);
      return {registered:true,token:registeredToken};
    })();
    return pushRegistrationTask.finally(()=>{pushRegistrationTask=null;});
  },

  addReceivedListener(callback) {
    if(!nativePushSupported())return null;
    installHandler();
    return Notifications.addNotificationReceivedListener(callback);
  },

  addResponseListener(callback) {
    if(!nativePushSupported())return null;
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  async setBadgeCount(count) {
    if(!nativePushSupported())return false;
    try { return await Notifications.setBadgeCountAsync(Math.max(0,Number(count)||0)); }
    catch { return false; }
  },

  async sendTest() {
    if(nativePushSupported()) {
      await Notifications.scheduleNotificationAsync({
        content:{title:'MeshPay notification test',body:'Notification delivery is enabled on this device.',sound:soundEnabled?'default':null},
        trigger:null,
      });
      return true;
    }
    const BrowserNotification=browserNotifications();
    if(!BrowserNotification||BrowserNotification.permission!=='granted')return false;
    new BrowserNotification('MeshPay notifications are on',{
      body:'Your browser is ready to show MeshPay notifications on this device.',
      tag:'meshpay-notification-test',
    });
    return true;
  },
};
