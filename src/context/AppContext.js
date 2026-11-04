import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { transactionsService } from '../services/transactionsService';
import { recipientLookupService } from '../services/recipientLookupService';
import { authService } from '../services/authService';
import { appLockService } from '../services/appLockService';
import { preferencesService } from '../services/preferencesService';
import { privacyAccountService } from '../services/privacyAccountService';
import { accountLockLocalService } from '../services/accountLockLocalService';
import { privacyAccountCacheService } from '../services/privacyAccountCacheService';
import { notificationsApiService } from '../services/notificationsApiService';
import { notificationsService } from '../services/notificationsService';
import { offlineTransactionLedgerService } from '../services/offlineTransactionLedgerService';
import { meshService } from '../services/meshService';
import { setColorScheme } from '../theme/colors';
import { apiClient } from '../services/apiClient';
import { navigationRef } from '../navigation/navigationRef';

const Ctx = createContext(null);

export function AppProvider({children}) {
  const [user,setUser]=useState(null);
  const [transactions,setTransactions]=useState([]);
  const [filter,setFilter]=useState('All');
  const [offlineSession,setOfflineSession]=useState(false);
  const [isRestoringSession,setRestoringSession]=useState(true);
  const [settings,setSettings]=useState({theme:'light',notificationsEnabled:false,notificationSoundEnabled:true});
  const [unreadNotificationCount,setUnreadNotificationCount]=useState(0);
  const [privacyAccount,setPrivacyAccount]=useState(null);
  const [localAccountLocked,setLocalAccountLocked]=useState(false);
  const [lockSyncPending,setLockSyncPending]=useState(false);
  const [appLock,setAppLock]=useState({enabled:false,type:null});
  const [appLocked,setAppLocked]=useState(false);
  const [appLockLoading,setAppLockLoading]=useState(false);
  const sessionActive=useRef(false);
  const lastAppState=useRef(AppState.currentState);
  const settingsRef=useRef(settings);
  const stateEpoch=useRef(0);
  const accountSyncTimer=useRef(null);
  const notificationTimer=useRef(null);

  useEffect(()=>{
    sessionActive.current=Boolean(user?.id);
    if(!user?.id){setUnreadNotificationCount(0);notificationsService.setBadgeCount(0);}
  },[user?.id]);

  const refreshTransactions=useCallback(async(upiId)=>{
    const epoch=stateEpoch.current;
    try { const items=await transactionsService.list(upiId);if(epoch===stateEpoch.current)setTransactions(items); }
    catch { if(epoch===stateEpoch.current)setTransactions([]); }
  },[]);

  const clearSession=useCallback(async({remoteLogout=false,navigate=true}={})=>{
    sessionActive.current=false;
    stateEpoch.current+=1;
    if(accountSyncTimer.current){clearInterval(accountSyncTimer.current);accountSyncTimer.current=null;}
    if(notificationTimer.current){clearInterval(notificationTimer.current);notificationTimer.current=null;}
    if(remoteLogout)await authService.logout();
    else await authService.clearLocalSession();
    setUser(null);
    setTransactions([]);
    setPrivacyAccount(null);
    setUnreadNotificationCount(0);
    setFilter('All');
    setOfflineSession(false);
    setLocalAccountLocked(false);
    setLockSyncPending(false);
    setAppLock({enabled:false,type:null});
    setAppLocked(false);
    setAppLockLoading(false);
    setRestoringSession(false);
    notificationsService.setBadgeCount(0);
    if(navigate&&navigationRef.isReady())navigationRef.reset({index:0,routes:[{name:'Splash'}]});
  },[]);

  const initializeAppLock=useCallback(async(userId,{offline=false}={})=>{
    if(!userId)return {enabled:false,type:null};
    const epoch=stateEpoch.current;
    setAppLockLoading(true);
    let value;
    try { value=await appLockService.status(userId); }
    catch(error) {
      if(error?.status===401) {
        if(epoch===stateEpoch.current)setAppLockLoading(false);
        throw error;
      }
      if(error?.status===404) value={enabled:false,type:null};
      else {
        const cached=await appLockService.cached(userId);
        value=offline?{enabled:true,type:cached?.type||null,unavailable:true}:(cached||{enabled:false,type:null});
      }
    }
    if(epoch!==stateEpoch.current)return value;
    setAppLock(value);
    setAppLocked(Boolean(value.enabled));
    setAppLockLoading(false);
    return value;
  },[]);

  const updateAppLockState=useCallback((value,{locked=false}={})=>{
    setAppLock(value||{enabled:false,type:null});
    setAppLocked(Boolean(locked));
    setAppLockLoading(false);
  },[]);

  const unlockAppLock=useCallback(async password=>{
    const epoch=stateEpoch.current;
    await appLockService.verify(password);
    if(epoch!==stateEpoch.current)return;
    // The lock gate is now open for this session; refresh the profile before
    // mounting the rest of the authenticated app after a locked restore.
    const profile=await apiClient.get('/api/auth/me');
    if(epoch!==stateEpoch.current)return;
    if(profile?.id)setUser(profile);
    setAppLocked(false);
  },[]);

  const lockAppNow=useCallback(()=>{
    if(appLock.enabled)setAppLocked(true);
  },[appLock.enabled]);

  useEffect(()=>{
    const lockForBackground=()=>{
      if(!user?.id||!appLock.enabled)return;
      setAppLocked(true);
      appLockService.lockSession().catch(()=>{});
    };
    const subscription=AppState.addEventListener('change',next=>{
      const previous=lastAppState.current;
      if(user?.id&&appLock.enabled&&previous==='active'&&next!=='active'){
        lockForBackground();
      }
      if(user?.id&&appLock.enabled&&previous!=='active'&&next==='active'){
        lockForBackground();
      }
      lastAppState.current=next;
    });
    const visibility=()=>{if(typeof document!=='undefined'&&document.visibilityState!=='visible')lockForBackground();};
    if(typeof document!=='undefined')document.addEventListener('visibilitychange',visibility);
    return()=>{subscription.remove();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);};
  },[user?.id,appLock.enabled]);

  const handleUnauthorized=useCallback(()=>{
    void clearSession({navigate:true});
  },[clearSession]);

  useEffect(()=>{
    apiClient.setUnauthorizedHandler(handleUnauthorized);
    return()=>apiClient.setUnauthorizedHandler(null);
  },[handleUnauthorized]);

  const handleAppLockRequired=useCallback(()=>{
    if(!sessionActive.current)return;
    setAppLock(current=>({...current,enabled:true}));
    setAppLocked(true);
  },[]);

  useEffect(()=>{
    apiClient.setAppLockRequiredHandler(handleAppLockRequired);
    return()=>apiClient.setAppLockRequiredHandler(null);
  },[handleAppLockRequired]);

  const refreshNotificationCount=useCallback(async()=>{
    if(!user?.id||!sessionActive.current||offlineSession||appLocked)return 0;
    const epoch=stateEpoch.current;
    try {
      const result=await notificationsApiService.unreadCount();
      if(epoch!==stateEpoch.current)return null;
      const count=Math.max(0,Number(result?.unreadCount)||0);
      setUnreadNotificationCount(count);
      await notificationsService.setBadgeCount(count);
      if(epoch!==stateEpoch.current)return null;
      return count;
    } catch { return null; }
  },[user?.id,offlineSession,appLocked]);

  useEffect(()=>{
    preferencesService.load().then(saved=>{
      settingsRef.current=saved;
      setColorScheme(saved.theme);
      setSettings(saved);
    });
  },[]);

  const resolvedTheme=settings.theme;

  useEffect(()=>{notificationsService.setSoundEnabled(settings.notificationSoundEnabled);},[settings.notificationSoundEnabled]);

  useEffect(()=>{
    if(!user?.id||!user?.upiId||appLocked)return undefined;
    const subscription=meshService.subscribeToReceipts(user.upiId,{
      onSaved:()=>offlineTransactionLedgerService.syncPendingTransactions(user.upiId).catch(()=>{}),
      onError:()=>{},
    });
    return()=>subscription?.remove?.();
  },[user?.id,user?.upiId,appLocked]);

  useEffect(()=>{
    if(!user?.id||offlineSession||appLocked)return undefined;
    refreshNotificationCount();
    const timer=setInterval(refreshNotificationCount,30000);
    notificationTimer.current=timer;
    const received=notificationsService.addReceivedListener(()=>refreshNotificationCount());
    const state=AppState.addEventListener('change',next=>{if(next==='active')refreshNotificationCount();});
    return ()=>{clearInterval(timer);if(notificationTimer.current===timer)notificationTimer.current=null;received?.remove?.();state.remove();};
  },[user?.id,offlineSession,appLocked,refreshNotificationCount]);

  useEffect(()=>{
    if(!user?.id||offlineSession||appLocked||!settings.notificationsEnabled)return;
    notificationsService.registerPushToken(true,settings.notificationSoundEnabled).catch(()=>{});
  },[user?.id,offlineSession,appLocked,settings.notificationsEnabled,settings.notificationSoundEnabled]);
  const updateSettings=useCallback(async patch=>{
    const next={...settings,...patch};
    settingsRef.current=next;
    setColorScheme(next.theme);
    setSettings(next);
    try { await preferencesService.save(next); return true; }
    catch {
      settingsRef.current=settings;
      setColorScheme(settings.theme);
      setSettings(settings);
      return false;
    }
  },[settings]);

  const refreshPrivacyAccount=useCallback(async(accountUserId=user?.id)=>{
    const epoch=stateEpoch.current;
    const value=await privacyAccountService.get();
    if(epoch===stateEpoch.current){
      setPrivacyAccount(value);
      await privacyAccountCacheService.set(accountUserId,value).catch(()=>{});
    }
    return value;
  },[user?.id]);

  const updatePrivacyAccount=useCallback(async patch=>{
    const epoch=stateEpoch.current;
    const current=privacyAccount;
    const value=await privacyAccountService.update({
      offlinePaymentLimit:patch.offlinePaymentLimit??current?.offlinePaymentLimit??0,
      hideBalance:patch.hideBalance??current?.hideBalance??false,
      hideTransactionDetails:patch.hideTransactionDetails??current?.hideTransactionDetails??false,
      ...(patch.password?{password:patch.password}:{}),
    });
    if(epoch===stateEpoch.current){
      setPrivacyAccount(value);
      await privacyAccountCacheService.set(user?.id,value).catch(()=>{});
      if(epoch!==stateEpoch.current)return value;
      if(patch.hideTransactionDetails!==undefined)await refreshTransactions(user?.upiId);
    }
    return value;
  },[privacyAccount,user?.id,refreshTransactions,user?.upiId]);

  const setAccountLockLocally=useCallback(async(locked,pending=true)=>{
    if(!user?.id)throw new Error('Sign in before locking this account.');
    const userId=user.id;
    const epoch=stateEpoch.current;
    if(locked){
      await accountLockLocalService.lock(userId,pending);
      if(epoch!==stateEpoch.current||!sessionActive.current)return;
      setLocalAccountLocked(true);
      setLockSyncPending(pending);
    }else{
      await accountLockLocalService.unlock(userId);
      if(epoch!==stateEpoch.current||!sessionActive.current)return;
      setLocalAccountLocked(false);
      setLockSyncPending(false);
    }
  },[user?.id]);

  const restoreLocalAccountLock=useCallback(async(userId)=>{
    const epoch=stateEpoch.current;
    const local=await accountLockLocalService.get(userId).catch(()=>({locked:false,pendingSync:false}));
    if(epoch===stateEpoch.current){
      setLocalAccountLocked(Boolean(local.locked));
      setLockSyncPending(Boolean(local.pendingSync));
    }
    return local;
  },[]);

  const markAccountLockSynchronized=useCallback(async()=>{
    if(!user?.id||!sessionActive.current)return;
    const userId=user.id;
    const epoch=stateEpoch.current;
    await accountLockLocalService.markSynchronized(userId);
    if(epoch!==stateEpoch.current||!sessionActive.current)return;
    setLockSyncPending(false);
  },[user?.id]);

  const isAccountLocked=Boolean(localAccountLocked||privacyAccount?.accountLocked);

  useEffect(()=>{
    let active=true;
    const epoch=stateEpoch.current;
    const isCurrent=()=>active&&epoch===stateEpoch.current;
    authService.restoreSession().then(async session=>{
      if(!isCurrent()||!session)return;
      const lockStatus=await initializeAppLock(session.user?.id,{offline:Boolean(session.offline)});
      if(!isCurrent())return;
      const localLock=await accountLockLocalService.get(session.user?.id).catch(()=>({locked:false,pendingSync:false}));
      if(!isCurrent())return;
      sessionActive.current=true;
      setLocalAccountLocked(Boolean(localLock.locked));setLockSyncPending(Boolean(localLock.pendingSync));
      setUser(session.user);
      setOfflineSession(Boolean(session.offline));
      const cachedPrivacy=await privacyAccountCacheService.get(session.user?.id);
      if(!isCurrent())return;
      if(cachedPrivacy)setPrivacyAccount(cachedPrivacy);
      if(!session.offline&&!lockStatus.enabled){
        try {
          const remote=await privacyAccountService.get();
          if(isCurrent()){setPrivacyAccount(remote);await privacyAccountCacheService.set(session.user?.id,remote).catch(()=>{});}
        } catch {}
        if(!isCurrent())return;
        await Promise.allSettled([refreshTransactions(session.user?.upiId),recipientLookupService.sync(session.user?.id)]);
      }
    }).catch(()=>{}).finally(()=>{if(isCurrent())setRestoringSession(false);});
    return()=>{active=false;};
  },[refreshTransactions,initializeAppLock]);

  useEffect(()=>{
    let active=true;
    const epoch=stateEpoch.current;
    const userId=user?.id;
    const upiId=user?.upiId;
    const isCurrent=()=>active&&sessionActive.current&&epoch===stateEpoch.current&&user?.id===userId;
    if(!user?.id){
      setPrivacyAccount(null);setLocalAccountLocked(false);setLockSyncPending(false);
      return undefined;
    }
    if(appLocked)return undefined;
    const syncAccount=async()=>{
      if(!isCurrent())return;
      const local=await accountLockLocalService.get(userId).catch(()=>({locked:false,pendingSync:false}));
      if(!isCurrent())return;
      setLocalAccountLocked(Boolean(local.locked));
      setLockSyncPending(Boolean(local.pendingSync));
      try{
        const value=local.pendingSync&&local.locked
          ?await privacyAccountService.lock()
          :await privacyAccountService.get();
        if(!isCurrent())return;
        setPrivacyAccount(value);
        await privacyAccountCacheService.set(userId,value).catch(()=>{});
        if(!isCurrent())return;
        setOfflineSession(false);
        if(value.accountLocked){
          await accountLockLocalService.lock(userId,false).catch(()=>{});
          if(!isCurrent())return;
          setLocalAccountLocked(true);setLockSyncPending(false);
        }else if(local.pendingSync&&local.locked){
          await accountLockLocalService.markSynchronized(userId).catch(()=>{});
          if(!isCurrent())return;
          setLocalAccountLocked(true);setLockSyncPending(false);
        }
      }catch{}
      if(isCurrent())await offlineTransactionLedgerService.syncPendingTransactions(upiId).catch(()=>{});
    };
    syncAccount();
    const timer=setInterval(syncAccount,15000);
    accountSyncTimer.current=timer;
    const appState=AppState.addEventListener('change',next=>{if(next==='active')syncAccount();});
    return()=>{active=false;clearInterval(timer);if(accountSyncTimer.current===timer)accountSyncTimer.current=null;appState.remove();};
  },[user?.id,user?.upiId,offlineSession,appLocked]);

  const value=useMemo(()=>({user,setUser,transactions,setTransactions,refreshTransactions,filter,setFilter,offlineSession,setOfflineSession,isRestoringSession,settings,updateSettings,resolvedTheme,privacyAccount,refreshPrivacyAccount,updatePrivacyAccount,isAccountLocked,lockSyncPending,setAccountLockLocally,restoreLocalAccountLock,markAccountLockSynchronized,unreadNotificationCount,refreshNotificationCount,clearSession,appLock,appLocked,appLockLoading,initializeAppLock,updateAppLockState,unlockAppLock,lockAppNow}),
    [user,transactions,refreshTransactions,filter,offlineSession,isRestoringSession,settings,updateSettings,resolvedTheme,privacyAccount,refreshPrivacyAccount,updatePrivacyAccount,isAccountLocked,lockSyncPending,setAccountLockLocally,restoreLocalAccountLock,markAccountLockSynchronized,unreadNotificationCount,refreshNotificationCount,clearSession,appLock,appLocked,appLockLoading,initializeAppLock,updateAppLockState,unlockAppLock,lockAppNow]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp=()=>useContext(Ctx);
