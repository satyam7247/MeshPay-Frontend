import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Appearance } from 'react-native';
import { transactionsService } from '../services/transactionsService';
import { recipientLookupService } from '../services/recipientLookupService';
import { authService } from '../services/authService';
import { preferencesService } from '../services/preferencesService';
import { privacyAccountService } from '../services/privacyAccountService';
import { accountLockLocalService } from '../services/accountLockLocalService';
import { privacyAccountCacheService } from '../services/privacyAccountCacheService';
import { notificationsApiService } from '../services/notificationsApiService';
import { notificationsService } from '../services/notificationsService';
import { offlineTransactionLedgerService } from '../services/offlineTransactionLedgerService';
import { meshService } from '../services/meshService';
import { setColorScheme } from '../theme/colors';

const Ctx = createContext(null);

export function AppProvider({children}) {
  const [user,setUser]=useState(null);
  const [transactions,setTransactions]=useState([]);
  const [filter,setFilter]=useState('All');
  const [offlineSession,setOfflineSession]=useState(false);
  const [isRestoringSession,setRestoringSession]=useState(true);
  const [settings,setSettings]=useState({theme:'system',notificationsEnabled:false,notificationSoundEnabled:true});
  const [unreadNotificationCount,setUnreadNotificationCount]=useState(0);
  const [privacyAccount,setPrivacyAccount]=useState(null);
  const [localAccountLocked,setLocalAccountLocked]=useState(false);
  const [lockSyncPending,setLockSyncPending]=useState(false);
  const settingsRef=useRef(settings);
  const [systemColorScheme,setSystemColorScheme]=useState(Appearance.getColorScheme()==='dark'?'dark':'light');

  useEffect(()=>{
    if(!user?.id){setUnreadNotificationCount(0);notificationsService.setBadgeCount(0);}
  },[user?.id]);

  const refreshTransactions=useCallback(async(upiId)=>{
    try { const items=await transactionsService.list(upiId);setTransactions(items); }
    catch { setTransactions([]); }
  },[]);

  const refreshNotificationCount=useCallback(async()=>{
    if(!user?.id||offlineSession){setUnreadNotificationCount(0);return 0;}
    try {
      const result=await notificationsApiService.unreadCount();
      const count=Math.max(0,Number(result?.unreadCount)||0);
      setUnreadNotificationCount(count);
      await notificationsService.setBadgeCount(count);
      return count;
    } catch { return null; }
  },[user?.id,user?.upiId,offlineSession]);

  useEffect(()=>{
    preferencesService.load().then(saved=>{
      const system=Appearance.getColorScheme()==='dark'?'dark':'light';
      settingsRef.current=saved;
      setColorScheme(saved.theme==='system'?system:saved.theme);
      setSettings(saved);
    });
    const subscription=Appearance.addChangeListener(({colorScheme})=>{
      const next=colorScheme==='dark'?'dark':'light';
      const theme=settingsRef.current.theme;
      setColorScheme(theme==='system'?next:theme);
      setSystemColorScheme(next);
    });
    return()=>subscription.remove();
  },[]);

  const resolvedTheme=settings.theme==='system'?systemColorScheme:settings.theme;

  useEffect(()=>{notificationsService.setSoundEnabled(settings.notificationSoundEnabled);},[settings.notificationSoundEnabled]);

  useEffect(()=>{
    if(!user?.id||!user?.upiId)return undefined;
    const subscription=meshService.subscribeToReceipts(user.upiId,{
      onSaved:()=>offlineTransactionLedgerService.syncPendingTransactions(user.upiId).catch(()=>{}),
      onError:()=>{},
    });
    return()=>subscription?.remove?.();
  },[user?.id,user?.upiId]);

  useEffect(()=>{
    if(!user?.id||offlineSession)return undefined;
    refreshNotificationCount();
    const timer=setInterval(refreshNotificationCount,30000);
    const received=notificationsService.addReceivedListener(()=>refreshNotificationCount());
    const state=AppState.addEventListener('change',next=>{if(next==='active')refreshNotificationCount();});
    return ()=>{clearInterval(timer);received?.remove?.();state.remove();};
  },[user?.id,offlineSession,refreshNotificationCount]);

  useEffect(()=>{
    if(!user?.id||offlineSession||!settings.notificationsEnabled)return;
    notificationsService.registerPushToken(true,settings.notificationSoundEnabled).catch(()=>{});
  },[user?.id,offlineSession,settings.notificationsEnabled,settings.notificationSoundEnabled]);
  const updateSettings=useCallback(async patch=>{
    const next={...settings,...patch};
    settingsRef.current=next;
    setColorScheme(next.theme==='system'?systemColorScheme:next.theme);
    setSettings(next);
    try { await preferencesService.save(next); return true; }
    catch { settingsRef.current=settings; setSettings(settings); return false; }
  },[settings,systemColorScheme]);

  const refreshPrivacyAccount=useCallback(async(accountUserId=user?.id)=>{
    const value=await privacyAccountService.get();
    setPrivacyAccount(value);
    await privacyAccountCacheService.set(accountUserId,value).catch(()=>{});
    return value;
  },[user?.id]);

  const updatePrivacyAccount=useCallback(async patch=>{
    const current=privacyAccount;
    const value=await privacyAccountService.update({
      offlinePaymentLimit:patch.offlinePaymentLimit??current?.offlinePaymentLimit??0,
      hideBalance:patch.hideBalance??current?.hideBalance??false,
      hideTransactionDetails:patch.hideTransactionDetails??current?.hideTransactionDetails??false,
    });
    setPrivacyAccount(value);
    await privacyAccountCacheService.set(user?.id,value).catch(()=>{});
    if(patch.hideTransactionDetails!==undefined)await refreshTransactions(user?.upiId);
    return value;
  },[privacyAccount,user?.id,refreshTransactions,user?.upiId]);

  const setAccountLockLocally=useCallback(async(locked,pending=true)=>{
    if(!user?.id)throw new Error('Sign in before locking this account.');
    if(locked){
      await accountLockLocalService.lock(user.id,pending);
      setLocalAccountLocked(true);
      setLockSyncPending(pending);
    }else{
      await accountLockLocalService.unlock(user.id);
      setLocalAccountLocked(false);
      setLockSyncPending(false);
    }
  },[user?.id]);

  const restoreLocalAccountLock=useCallback(async(userId)=>{
    const local=await accountLockLocalService.get(userId).catch(()=>({locked:false,pendingSync:false}));
    setLocalAccountLocked(Boolean(local.locked));
    setLockSyncPending(Boolean(local.pendingSync));
    return local;
  },[]);

  const markAccountLockSynchronized=useCallback(async()=>{
    if(user?.id)await accountLockLocalService.markSynchronized(user.id);
    setLockSyncPending(false);
  },[user?.id]);

  const isAccountLocked=Boolean(localAccountLocked||privacyAccount?.accountLocked);

  useEffect(()=>{
    let active=true;
    authService.restoreSession().then(async session=>{
      if(!active||!session)return;
      const localLock=await accountLockLocalService.get(session.user?.id).catch(()=>({locked:false,pendingSync:false}));
      if(active){setLocalAccountLocked(Boolean(localLock.locked));setLockSyncPending(Boolean(localLock.pendingSync));}
      setUser(session.user);
      setOfflineSession(Boolean(session.offline));
      const cachedPrivacy=await privacyAccountCacheService.get(session.user?.id);
      if(active&&cachedPrivacy)setPrivacyAccount(cachedPrivacy);
      if(!session.offline){
        try {
          const remote=await privacyAccountService.get();
          if(active){setPrivacyAccount(remote);await privacyAccountCacheService.set(session.user?.id,remote).catch(()=>{});}
        } catch {}
        await Promise.allSettled([refreshTransactions(session.user?.upiId),recipientLookupService.sync(session.user?.id)]);
      }
    }).catch(()=>{}).finally(()=>{if(active)setRestoringSession(false);});
    return()=>{active=false;};
  },[refreshTransactions]);

  useEffect(()=>{
    let active=true;
    if(!user?.id){
      setPrivacyAccount(null);setLocalAccountLocked(false);setLockSyncPending(false);
      return undefined;
    }
    const syncAccount=async()=>{
      const local=await accountLockLocalService.get(user.id).catch(()=>({locked:false,pendingSync:false}));
      if(!active)return;
      setLocalAccountLocked(Boolean(local.locked));
      setLockSyncPending(Boolean(local.pendingSync));
      try{
        const value=local.pendingSync&&local.locked
          ?await privacyAccountService.lock()
          :await privacyAccountService.get();
        if(!active)return;
        setPrivacyAccount(value);
        await privacyAccountCacheService.set(user.id,value).catch(()=>{});
        setOfflineSession(false);
        if(value.accountLocked){
          await accountLockLocalService.lock(user.id,false).catch(()=>{});
          setLocalAccountLocked(true);setLockSyncPending(false);
        }else if(local.pendingSync&&local.locked){
          await accountLockLocalService.markSynchronized(user.id).catch(()=>{});
          setLocalAccountLocked(true);setLockSyncPending(false);
        }
      }catch{}
      if(active)await offlineTransactionLedgerService.syncPendingTransactions(user.upiId).catch(()=>{});
    };
    syncAccount();
    const timer=setInterval(syncAccount,15000);
    const appState=AppState.addEventListener('change',next=>{if(next==='active')syncAccount();});
    return()=>{active=false;clearInterval(timer);appState.remove();};
  },[user?.id,offlineSession]);

  const value=useMemo(()=>({user,setUser,transactions,setTransactions,refreshTransactions,filter,setFilter,offlineSession,setOfflineSession,isRestoringSession,settings,updateSettings,resolvedTheme,privacyAccount,refreshPrivacyAccount,updatePrivacyAccount,isAccountLocked,lockSyncPending,setAccountLockLocally,restoreLocalAccountLock,markAccountLockSynchronized,unreadNotificationCount,refreshNotificationCount}),
    [user,transactions,refreshTransactions,filter,offlineSession,isRestoringSession,settings,updateSettings,resolvedTheme,privacyAccount,refreshPrivacyAccount,updatePrivacyAccount,isAccountLocked,lockSyncPending,setAccountLockLocally,restoreLocalAccountLock,markAccountLockSynchronized,unreadNotificationCount,refreshNotificationCount]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp=()=>useContext(Ctx);
