import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors as c } from '../theme/colors';
import {
  Splash,Auth,Home,SendMoney,Confirm,Broadcast,Mesh,BankAccounts,Offline,Upload,
  Success,History,Details,Profile,Request,Scan,Settings,PasswordRecovery,Notifications,
} from '../screens/Screens';
import { useApp } from '../context/AppContext';

const Stack=createNativeStackNavigator();
const Tabs=createBottomTabNavigator();

function MainTabs() {
  return <Tabs.Navigator initialRouteName="Home" screenOptions={({route})=>({
    headerShown:false,
    tabBarStyle:{backgroundColor:c.surface,borderTopColor:c.line,height:68,paddingBottom:8,paddingTop:7},
    tabBarActiveTintColor:c.blue,
    tabBarInactiveTintColor:c.muted,
    tabBarLabelStyle:{fontSize:10,fontWeight:'700'},
    tabBarIcon:({color,size})=>{
      const icons={Home:'home-outline',Mesh:'git-network-outline',Wallet:'wallet-outline',Profile:'person-circle-outline'};
      return <Ionicons name={icons[route.name]} size={size} color={color}/>;
    },
  })}>
    <Tabs.Screen name="Home" component={Home}/>
    <Tabs.Screen name="Mesh" component={Mesh}/>
    <Tabs.Screen name="Wallet" component={BankAccounts}/>
    <Tabs.Screen name="Profile" component={Profile}/>
  </Tabs.Navigator>;
}

export default function AppNavigator() {
  const {user}=useApp();
  return <Stack.Navigator initialRouteName="Splash" screenOptions={{
    headerShown:false,
    contentStyle:{backgroundColor:c.bg},
    animation:'slide_from_right',
  }}>
    <Stack.Screen name="Splash" component={Splash}/>
    <Stack.Screen name="Auth" component={Auth}/>
    <Stack.Screen name="PasswordRecovery" component={PasswordRecovery}/>
    <Stack.Screen name="Main" component={MainTabs}/>
    <Stack.Screen name="Send" component={SendMoney}/>
    <Stack.Screen name="Confirm" component={Confirm}/>
    <Stack.Screen name="Scan" component={Scan}/>
    <Stack.Screen name="Broadcast" component={Broadcast}/>
    <Stack.Screen name="Offline" component={Offline}/>
    <Stack.Screen name="Upload" component={Upload}/>
    <Stack.Screen name="Success" component={Success}/>
    <Stack.Screen name="History" component={History}/>
    <Stack.Screen name="Details" component={Details}/>
    <Stack.Screen name="Request" component={Request}/>
    {user?<Stack.Screen name="Settings" component={Settings}/>:null}
    {user?<Stack.Screen name="Notifications" component={Notifications}/>:null}
  </Stack.Navigator>;
}
