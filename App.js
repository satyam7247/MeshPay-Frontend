import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { useApp } from './src/context/AppContext';
import { notificationsService } from './src/services/notificationsService';

function AppShell() {
  const {resolvedTheme,user}=useApp();
  const navigationRef=useNavigationContainerRef();
  const base=resolvedTheme==='dark'?DarkTheme:DefaultTheme;
  const theme={...base,colors:{...base.colors,background:colors.bg,card:colors.surface,text:colors.text,primary:colors.blue}};
  React.useEffect(()=>{
    const response=notificationsService.addResponseListener(()=>{
      if(user?.id&&navigationRef.isReady())navigationRef.navigate('Notifications');
    });
    return()=>response?.remove?.();
  },[user?.id,navigationRef]);
  return <NavigationContainer ref={navigationRef} theme={theme}><StatusBar style={resolvedTheme==='dark'?'light':'dark'}/><AppNavigator/></NavigationContainer>;
}

export default function App() {
  return <AppProvider><AppShell/></AppProvider>;
}
