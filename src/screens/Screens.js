import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, View, Text, TouchableOpacity, Switch, TextInput, ScrollView, Image, useWindowDimensions, Modal, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors as c } from '../theme/colors';
import { Page, Header, Button, Card, Label, Avatar, Field, Badge, SectionTitle } from '../components/UI';
import { UpiIntentButton } from '../components/UpiIntentButton';
import { useApp } from '../context/AppContext';
import { contactsService } from '../services/contactsService';
import { meshService } from '../services/meshService';
import { authService } from '../services/authService';
import { bankAccountsService } from '../services/bankAccountsService';
import { recipientLookupService } from '../services/recipientLookupService';
import { RecipientLookupStatus, RecipientDataSource, RecipientVerificationStatus, normalizeMobileNumber } from '../services/recipientModels';
import { paymentsService } from '../services/paymentsService';
import { notificationsService } from '../services/notificationsService';
import { privacyAccountService } from '../services/privacyAccountService';
import { deviceIdentityService } from '../services/deviceIdentityService';
import { passwordService } from '../services/passwordService';
import { accountDeletionService } from '../services/accountDeletionService';
import { notificationsApiService } from '../services/notificationsApiService';
import { apiClient } from '../services/apiClient';
import { offlineTransactionLedgerService } from '../services/offlineTransactionLedgerService';

const DEMO_MERCHANT_UPI_ID = __DEV__
  ? (process.env.EXPO_PUBLIC_DEMO_MERCHANT_UPI_ID || 'merchant@upi').trim()
  : '';

function Row({ icon, title, subtitle, action, danger=false }) {
  return <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
    <View style={{width:42,height:42,borderRadius:14,backgroundColor:danger?'#FFF0F1':c.surface2,alignItems:'center',justifyContent:'center'}}>
      <Ionicons name={icon} size={19} color={danger?c.red:c.blue}/>
    </View>
    <View style={{flex:1,gap:3}}><Text style={{color:danger?c.red:c.text,fontWeight:'700',fontSize:14}}>{title}</Text>{subtitle?<Text style={{color:c.muted,fontSize:12}}>{subtitle}</Text>:null}</View>
    {action||null}
  </View>;
}

const bankLogos={
  'State Bank of India':require('../assets/banks/sbi.png'),
  'HDFC Bank':require('../assets/banks/hdfc.png'),
  'ICICI Bank':require('../assets/banks/icici.png'),
  'Axis Bank':require('../assets/banks/axis.png'),
  'Punjab National Bank':require('../assets/banks/pnb.png'),
  'Bank of Baroda':require('../assets/banks/bank-of-baroda.png'),
  'Kotak Mahindra Bank':require('../assets/banks/kotak.png'),
  'Canara Bank':require('../assets/banks/canara.png'),
  'Union Bank of India':require('../assets/banks/union-bank.png'),
  'Bank of India':require('../assets/banks/bank-of-india.png'),
  'Indian Bank':require('../assets/banks/indian-bank.png'),
  'Indian Overseas Bank':require('../assets/banks/iob.png'),
  'Central Bank of India':require('../assets/banks/central-bank.png'),
  'UCO Bank':require('../assets/banks/uco.png'),
  'IDBI Bank':require('../assets/banks/idbi.png'),
  'IDFC FIRST Bank':require('../assets/banks/idfc-first.png'),
  'Federal Bank':require('../assets/banks/federal.png'),
  'IndusInd Bank':require('../assets/banks/indusind.png'),
  'Yes Bank':require('../assets/banks/yes-bank.png'),
  'RBL Bank':require('../assets/banks/rbl.png'),
  'South Indian Bank':require('../assets/banks/south-indian.png'),
  'Bandhan Bank':require('../assets/banks/bandhan.png'),
  'AU Small Finance Bank':require('../assets/banks/au.png'),
};

function BankMark({bank}) {
  const logo=bankLogos[bank];
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{width:38,height:38,borderRadius:12,backgroundColor:c.surface2,alignItems:'center',justifyContent:'center'}}>
    {logo
      ?<Image source={logo} resizeMode="contain" style={{width:28,height:28}}/>
      :<Ionicons name="business-outline" size={19} color={c.blue}/>}
  </View>;
}

function EmptyState({ icon='file-tray-outline', title, message, action }) {
  return <Card style={{alignItems:'center',paddingVertical:28,paddingHorizontal:22,gap:10}}>
    <View style={{width:58,height:58,borderRadius:20,backgroundColor:c.surface2,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={27} color={c.blue}/></View>
    <Text style={{color:c.text,fontWeight:'800',fontSize:16,textAlign:'center'}}>{title}</Text>
    <Text style={{color:c.muted,textAlign:'center',lineHeight:20,fontSize:13}}>{message}</Text>
    {action||null}
  </Card>;
}

function BrandMark({ dark=false }) {
  return <View style={{alignItems:'center',gap:13}}>
    <View style={{width:68,height:68,borderRadius:23,backgroundColor:dark?'#102C4C':c.surface2,borderWidth:1,borderColor:dark?'#234C70':c.line,alignItems:'center',justifyContent:'center'}}>
      <Ionicons name="git-network-outline" size={34} color={c.cyan}/>
    </View>
    <Text style={{fontSize:31,fontWeight:'900',letterSpacing:-.8,color:dark?c.white:c.text}}>Mesh<Text style={{color:c.cyan}}>Pay</Text></Text>
  </View>;
}

export function Splash({navigation}) {
  const {user,isRestoringSession,offlineSession}=useApp();
  const {width:screenWidth}=useWindowDimensions();
  const gateProgress=useRef(new Animated.Value(0)).current;
  const buttonOpacity=useRef(new Animated.Value(0)).current;
  const [gateOpened,setGateOpened]=useState(false);
  const [continueBusy,setContinueBusy]=useState(false);
  const [isSecurityModalVisible,setIsSecurityModalVisible]=useState(false);
  const [diagnostics,setDiagnostics]=useState({loading:false,storageActive:null,storagePersistent:true,encryptionEnabled:false,bridgeListening:false});
  const useNativeDriver=Platform.OS!=='web';

  useEffect(()=>{
    const opening=Animated.sequence([
      Animated.timing(gateProgress,{toValue:1,duration:3200,easing:Easing.inOut(Easing.cubic),useNativeDriver}),
      Animated.timing(buttonOpacity,{toValue:1,duration:450,useNativeDriver}),
    ]);
    opening.start(({finished})=>{if(finished)setGateOpened(true);});
    return()=>opening.stop();
  },[buttonOpacity,gateProgress]);

  const leftDoorStyle={transform:[{translateX:gateProgress.interpolate({inputRange:[0,1],outputRange:[0,-screenWidth/2]})}]};
  const rightDoorStyle={transform:[{translateX:gateProgress.interpolate({inputRange:[0,1],outputRange:[0,screenWidth/2]})}]};
  const doorColor='#12455B';
  useEffect(()=>{
    if(!isSecurityModalVisible)return;
    setDiagnostics(current=>({...current,loading:true}));
    let active=true;
    Promise.all([
      offlineTransactionLedgerService.getDiagnostics().catch(()=>({storageActive:false,encryptionEnabled:false})),
      Promise.resolve(meshService.getStatus()),
    ]).then(([ledger,bridge])=>{
      if(active)setDiagnostics({loading:false,storageActive:ledger.storageActive,storagePersistent:ledger.storagePersistent!==false,encryptionEnabled:ledger.encryptionEnabled,bridgeListening:bridge.listening});
    });
    return()=>{active=false;};
  },[isSecurityModalVisible]);
  const continueToMeshPay=async()=>{
    if(continueBusy)return;
    setContinueBusy(true);
    try {
      const [online]=await Promise.all([
        apiClient.isConfigured
          ?apiClient.get('/api/health',{timeoutMs:4500}).then(()=>true).catch(()=>false)
          :Promise.resolve(false),
        meshService.initialize().catch(()=>({available:false,listening:false})),
      ]);
      if(online&&user?.upiId&&!offlineSession){
        await offlineTransactionLedgerService.syncPendingTransactions(user.upiId).catch(()=>{});
      }
    } finally {
      navigation.replace('Main');
      setContinueBusy(false);
    }
  };
  const diagnosticRows=[
    {label:'Local Storage',value:diagnostics.storageActive===null?'Checking':!diagnostics.storageActive?'SQLite unavailable':diagnostics.storagePersistent?'SQLite ledger active · decimal amounts stored as strings':'Temporary browser-session SQLite · not saved after reload',ok:diagnostics.storageActive===true&&diagnostics.storagePersistent},
    {label:'Encryption Layer',value:diagnostics.encryptionEnabled?'AES-256 local database encryption enabled':'AES-256 local database encryption not enabled',ok:diagnostics.encryptionEnabled},
    {label:'Mesh Network',value:diagnostics.bridgeListening?'Bluetooth bridge listener active':'Native Bluetooth bridge not connected',ok:diagnostics.bridgeListening},
    {label:'Central Security',value:'Spring Boot bluetoothTxnId unique constraint is configured',ok:true},
  ];
  return <Page scroll={false} background={c.navy} contentStyle={{padding:0,gap:0,justifyContent:'space-between'}}>
    <StatusBar style="light"/>
    <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:18,paddingTop:24}}>
      <BrandMark dark/>
      <Text style={{fontSize:17,fontWeight:'700',color:c.white,marginTop:6}}>Pay without internet</Text>
      <Text style={{fontSize:14,color:'#AFC3D9',textAlign:'center',lineHeight:21,maxWidth:280}}>A peer-to-peer payment concept, designed for places with limited connectivity.</Text>
      <View style={{borderRadius:18,backgroundColor:'#123D57',borderWidth:1,borderColor:'#1F6077',paddingHorizontal:13,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:7,marginTop:2}}>
        <View style={{width:7,height:7,borderRadius:4,backgroundColor:meshService.getStatus().available?c.cyan:'#F0C878'}}/>
        <Text style={{color:'#BBD5E5',fontSize:12}}>Mode: <Text style={{color:meshService.getStatus().available?c.cyan:'#F0C878',fontWeight:'800'}}>{meshService.getStatus().available?'Bluetooth Mesh Enabled':'Bluetooth Mesh Preview'}</Text></Text>
      </View>
    </View>
    <View style={{height:210,justifyContent:'center',alignItems:'center'}}>
      <View style={{height:164,width:220,borderRadius:82,borderWidth:1,borderColor:'#17628C',alignItems:'center',justifyContent:'center',backgroundColor:'#0D2844'}}>
        <View style={{height:92,width:92,borderRadius:30,backgroundColor:'#123B60',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#2278A6'}}><Ionicons name="swap-horizontal" size={42} color={c.cyan}/></View>
        <Animated.View style={[{position:'absolute',left:106,top:0,width:4,height:'100%',borderRadius:2,backgroundColor:'#20B9D8'},leftDoorStyle]}/>
        <Animated.View style={[{position:'absolute',right:106,top:0,width:4,height:'100%',borderRadius:2,backgroundColor:'#20B9D8'},rightDoorStyle]}/>
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open MeshPay security diagnostics" accessibilityHint="Shows local storage, encryption, Bluetooth, and backend status" hitSlop={16} activeOpacity={0.7} onPress={()=>setIsSecurityModalVisible(true)} style={{position:'absolute',bottom:0,left:0,right:0,minHeight:42,alignItems:'center',justifyContent:'center',paddingHorizontal:8,zIndex:6}}>
        <Text style={{color:'#AFC3D9',fontSize:12,textAlign:'center'}}>Secured with Local SQLite &amp; Offline Mesh Verification</Text>
      </TouchableOpacity>
    </View>
    <Animated.View pointerEvents={gateOpened&&!isRestoringSession?'auto':'none'} style={{flexDirection:'row',gap:12,opacity:buttonOpacity,paddingHorizontal:20,paddingBottom:28}}>
      {isRestoringSession
        ?<View style={{flex:1}}><Button title="Loading your account..." disabled/></View>
        :user
        ?<TouchableOpacity accessibilityRole="button" disabled={!gateOpened||continueBusy} onPress={continueToMeshPay} style={{flex:1,minHeight:62,borderRadius:24,backgroundColor:'#00D2FF',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:10,opacity:continueBusy ? 0.75 : 1,elevation:5,shadowColor:'#00D2FF',shadowOpacity:.25,shadowRadius:14,shadowOffset:{width:0,height:4}}}>{continueBusy?<ActivityIndicator color={c.navy}/>:<><Text style={{color:c.navy,fontSize:17,fontWeight:'900'}}>Continue to MeshPay</Text><Ionicons name="arrow-forward" size={20} color={c.navy}/></>}</TouchableOpacity>
        :<>
          <View style={{flex:1}}><Button title="Log in" variant="outline" onPress={()=>navigation.navigate('Auth',{mode:'login'})}/></View>
          <View style={{flex:1}}><Button title="Sign up" icon="arrow-forward" onPress={()=>navigation.navigate('Auth',{mode:'signup'})}/></View>
        </>}
    </Animated.View>
    <View pointerEvents="none" style={{position:'absolute',top:0,bottom:0,left:0,right:0,zIndex:5,flexDirection:'row'}}>
      <Animated.View style={[{width:screenWidth/2,height:'100%',backgroundColor:doorColor,borderRightWidth:3,borderRightColor:c.cyan,justifyContent:'center'},leftDoorStyle]}>
        {[0,1,2].map((line)=><View key={line} style={{position:'absolute',left:`${24+line*24}%`,top:0,bottom:0,width:1,backgroundColor:'#28718A',opacity:.65}}/>)}
        <View style={{position:'absolute',right:14,top:'50%',width:13,height:13,borderRadius:7,backgroundColor:'#F0C878',borderWidth:2,borderColor:'#FFE3A5'}}/>
      </Animated.View>
      <Animated.View style={[{width:screenWidth/2,height:'100%',backgroundColor:doorColor,borderLeftWidth:3,borderLeftColor:c.cyan,justifyContent:'center'},rightDoorStyle]}>
        {[0,1,2].map((line)=><View key={line} style={{position:'absolute',left:`${24+line*24}%`,top:0,bottom:0,width:1,backgroundColor:'#28718A',opacity:.65}}/>)}
        <View style={{position:'absolute',left:14,top:'50%',width:13,height:13,borderRadius:7,backgroundColor:'#F0C878',borderWidth:2,borderColor:'#FFE3A5'}}/>
      </Animated.View>
    </View>
    <Modal visible={isSecurityModalVisible} transparent animationType="slide" onRequestClose={()=>setIsSecurityModalVisible(false)}>
      <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'center',padding:24}}>
        <View style={{backgroundColor:'#0A192F',borderRadius:20,borderWidth:1,borderColor:'#24506D',padding:22,gap:17}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
            <View style={{width:46,height:46,borderRadius:15,backgroundColor:'#143D57',alignItems:'center',justifyContent:'center'}}><Ionicons name="shield-checkmark-outline" size={24} color={c.cyan}/></View>
            <View style={{flex:1}}><Text style={{color:c.white,fontSize:18,fontWeight:'900'}}>MeshPay Security Architecture</Text><Text style={{color:'#AFC3D9',fontSize:12,marginTop:3}}>Live device and backend capability status</Text></View>
          </View>
          {diagnostics.loading?<ActivityIndicator color={c.cyan}/>:diagnosticRows.map(row=><View key={row.label} style={{flexDirection:'row',alignItems:'center',gap:11,backgroundColor:'#0C2037',borderRadius:14,padding:13}}>
            <Ionicons name={row.ok?'checkmark-circle':'alert-circle'} size={21} color={row.ok?'#43D69A':'#F0C878'}/>
            <View style={{flex:1}}><Text style={{color:c.white,fontSize:13,fontWeight:'800'}}>{row.label}</Text><Text style={{color:row.ok?'#77DDB2':'#F0C878',fontSize:12,marginTop:3}}>{row.value}</Text></View>
          </View>)}
          <TouchableOpacity accessibilityRole="button" onPress={()=>setIsSecurityModalVisible(false)} style={{height:48,borderRadius:16,backgroundColor:'#00D2FF',alignItems:'center',justifyContent:'center',marginTop:2}}><Text style={{color:c.navy,fontWeight:'900',fontSize:15}}>Close Diagnostics</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  </Page>;
}

export function Auth({navigation,route}) {
  const {setUser,setOfflineSession,refreshTransactions,refreshPrivacyAccount,restoreLocalAccountLock,resolvedTheme}=useApp();
  const [mode,setMode]=useState(route?.params?.mode==='signup'?'signup':'login');
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [phone,setPhone]=useState('');
  const [password,setPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const submitInFlight=useRef(false);
  const signup=mode==='signup';
  const submit=async()=>{
    if(submitInFlight.current)return;
    setError('');
    if(signup&&!name.trim())return setError('Enter your name.');
    if(!/^\S+@\S+\.\S+$/.test(email.trim()))return setError('Enter a valid email address.');
    if(signup&&!/^\+?[0-9\s()-]{8,18}$/.test(phone.trim()))return setError('Enter a valid phone number.');
    if(password.length<8)return setError('Password must be at least 8 characters.');
    if(signup&&password!==confirmPassword)return setError('Passwords do not match.');
    submitInFlight.current=true;
    setBusy(true);
    try {
      const session=signup
        ? await authService.signup({name:name.trim(),email:email.trim(),phone:phone.trim(),password})
        : await authService.login({email:email.trim(),password});
      if(session.deletionCancelled) {
        const notice='Your pending account deletion request was cancelled. Your account access has been restored.';
        if(Platform.OS==='web'&&typeof window!=='undefined')window.alert(notice);
        else Alert.alert('Deletion cancelled',notice);
      }
      await refreshPrivacyAccount(session.user?.id).catch(()=>{});
      await restoreLocalAccountLock(session.user?.id);
      setUser(session.user);
      setOfflineSession(false);
      navigation.replace('Main');
      await refreshTransactions(session.user?.upiId);
      await recipientLookupService.sync(session.user?.id).catch(()=>{});
    } catch(e) {
      setError(e.message==='Account service is not connected.'||e.message?.includes('not configured')
        ? 'We could not reach your account service. Check your connection and try again.'
        : e.message||'We could not complete this request. Please try again.');
    } finally { submitInFlight.current=false; setBusy(false); }
  };
  return <Page>
    <StatusBar style={resolvedTheme==='dark'?'light':'dark'}/>
    <BrandMark/>
    <View style={{gap:7,marginTop:8}}>
      <Text style={{fontSize:28,fontWeight:'900',letterSpacing:-.6,color:c.text}}>{signup?'Create your account':'Welcome back'}</Text>
      <Text style={{color:c.muted,fontSize:14,lineHeight:21}}>{signup?'A few details to set up your MeshPay account.':'Log in to continue to your account.'}</Text>
    </View>
    <View style={{flexDirection:'row',padding:5,borderRadius:15,backgroundColor:c.surface2,gap:5,borderWidth:1,borderColor:c.line}}>
      {['login','signup'].map(value=><TouchableOpacity key={value} onPress={()=>{setMode(value);setError('');}} activeOpacity={.8} style={{flex:1,paddingVertical:13,borderRadius:11,alignItems:'center',backgroundColor:mode===value?c.navy:'transparent'}}><Text style={{color:mode===value?c.white:c.muted,fontWeight:'800',fontSize:14}}>{value==='login'?'Log in':'Register'}</Text></TouchableOpacity>)}
    </View>
    <Card style={{gap:15,padding:18}}>
      {signup&&<View><Label>Full name</Label><Field value={name} onChangeText={setName} placeholder="Enter your name" autoCapitalize="words" returnKeyType="next"/></View>}
      <View><Label>Email address</Label><Field value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next"/></View>
      {signup&&<View><Label>Mobile number</Label><Field value={phone} onChangeText={setPhone} placeholder="Enter your phone number" keyboardType="phone-pad" autoComplete="tel" returnKeyType="next"/></View>}
      <View><Label>Password</Label><View style={{position:'relative',justifyContent:'center'}}><Field value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete={signup?'new-password':'current-password'} returnKeyType={signup?'next':'done'} style={{height:54,borderRadius:14,backgroundColor:c.bg,borderColor:c.line,borderWidth:1,paddingHorizontal:15,paddingRight:54,color:c.text,fontSize:15}}/><TouchableOpacity onPress={()=>setShowPassword(v=>!v)} style={{position:'absolute',right:12,padding:8}} accessibilityLabel={showPassword?'Hide password':'Show password'}><Ionicons name={showPassword?'eye-off-outline':'eye-outline'} size={20} color={c.muted}/></TouchableOpacity></View></View>
      {signup&&<View><Label>Confirm password</Label><Field value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your password" secureTextEntry={!showPassword} autoCapitalize="none" autoComplete="new-password" returnKeyType="done"/></View>}
    </Card>
    {error?<Card style={{borderColor:'#F2C1C5',backgroundColor:'#FFF4F4',padding:13}}><Text style={{color:c.red,lineHeight:20,fontSize:13}}>{error}</Text></Card>:null}
    <Button title={busy?'Please wait...':signup?'Create account':'Continue to MeshPay'} icon={busy?undefined:'arrow-forward'} disabled={busy} onPress={submit}/>
    {!signup?<TouchableOpacity onPress={()=>navigation.navigate('PasswordRecovery',{mode:'forgot'})} accessibilityRole="button" style={{alignSelf:'center',paddingVertical:6}}><Text style={{color:c.blue,fontWeight:'800',fontSize:13}}>Forgot Password?</Text></TouchableOpacity>:null}
    <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:7}}><Ionicons name="shield-checkmark-outline" size={15} color={c.muted}/><Text style={{color:c.muted,fontSize:12,textAlign:'center'}}>Your account password is never your UPI PIN.</Text></View>
  </Page>;
}

export function PasswordRecovery({navigation,route}) {
  const {setUser,setOfflineSession}=useApp();
  const isChange=route?.params?.mode==='change';
  const [stage,setStage]=useState('request');
  const [forgotCurrent,setForgotCurrent]=useState(false);
  const [email,setEmail]=useState('');
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [code,setCode]=useState('');
  const [challengeId,setChallengeId]=useState('');
  const [resetToken,setResetToken]=useState('');
  const [codeExpiresIn,setCodeExpiresIn]=useState(300);
  const [seconds,setSeconds]=useState(0);
  const [showPasswords,setShowPasswords]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('');
  const [completed,setCompleted]=useState(false);

  useEffect(()=>{
    if(seconds<=0)return undefined;
    const timer=setTimeout(()=>setSeconds(value=>Math.max(0,value-1)),1000);
    return()=>clearTimeout(timer);
  },[seconds]);

  const validNewPassword=value=>value.length>=8&&encodeURIComponent(value).replace(/%[0-9A-F]{2}/g,'U').length<=72
    &&/[A-Z]/.test(value)&&/[a-z]/.test(value)&&/[0-9]/.test(value)&&/[^A-Za-z0-9]/.test(value);
  const validateNew=()=>{
    if(!validNewPassword(newPassword))return 'Use 8–72 UTF-8 bytes with uppercase, lowercase, a number, and a special character.';
    if(newPassword!==confirmPassword)return 'New passwords do not match.';
    return '';
  };
  const sendOtp=async()=>{
    setBusy(true);setError('');setInfo('');
    try {
      const result=isChange?await passwordService.requestChangeOtp():await passwordService.requestForgot(email.trim());
      setChallengeId(result.challengeId);
      setCode('');
      setCodeExpiresIn(result.expiresInSeconds||300);
      setSeconds(result.resendAfterSeconds||60);
      setStage('otp');
      setInfo(result.message||'The request was processed. This does not confirm email delivery.');
    } catch(e) { setError(e.message||'Could not start password recovery. Try again later.'); }
    finally {setBusy(false);}
  };
  const verifyOtp=async()=>{
    setError('');
    if(!/^\d{6}$/.test(code))return setError('Enter the six-digit verification code.');
    setBusy(true);
    try {
      const result=await passwordService.verifyOtp(challengeId,code.trim());
      setResetToken(result.resetToken);
      setStage('reset');
      setInfo('Code verified. Choose a new password.');
    } catch(e) {setError(e.message||'The code could not be verified.');}
    finally {setBusy(false);}
  };
  const submitCurrentChange=async()=>{
    setError('');
    const validation=validateNew();if(validation)return setError(validation);
    if(!currentPassword)return setError('Enter your current password.');
    setBusy(true);
    try {
      await passwordService.change(currentPassword,newPassword);
      await authService.logout();setUser(null);setOfflineSession(false);setCompleted(true);
      setInfo('Your password was updated. All existing sessions were signed out.');
    } catch(e) {setError(e.message||'Password could not be changed.');}
    finally {setBusy(false);}
  };
  const submitReset=async()=>{
    setError('');
    const validation=validateNew();if(validation)return setError(validation);
    setBusy(true);
    try {
      await passwordService.reset(challengeId,resetToken,newPassword);
      await authService.logout();setUser(null);setOfflineSession(false);setCompleted(true);
      setInfo('Your password was reset. All existing sessions were signed out.');
    } catch(e) {setError(e.message||'Password could not be reset.');}
    finally {setBusy(false);}
  };
  const continueToLogin=()=>navigation.reset({index:0,routes:[{name:'Auth',params:{mode:'login'}}]});
  const passwordField=(label,value,onChange,placeholder)=> <View style={{gap:7}}><Label>{label}</Label><View style={{position:'relative',justifyContent:'center'}}><Field value={value} onChangeText={onChange} placeholder={placeholder} secureTextEntry={!showPasswords} autoCapitalize="none" autoComplete="new-password" style={{minHeight:52,paddingRight:50}}/><TouchableOpacity onPress={()=>setShowPasswords(v=>!v)} accessibilityLabel={showPasswords?'Hide passwords':'Show passwords'} style={{position:'absolute',right:12,padding:8}}><Ionicons name={showPasswords?'eye-off-outline':'eye-outline'} size={20} color={c.muted}/></TouchableOpacity></View></View>;

  return <Page>
    <Header title={isChange?'Change Password':'Reset Password'} back onBack={()=>navigation.goBack()}/>
    <View style={{gap:7}}><Text style={{fontSize:25,fontWeight:'900',color:c.text}}>{completed?'Password updated':stage==='request'?(isChange?'Secure your account':'Forgot your password?'):stage==='otp'?'Verify your email':'Choose a new password'}</Text><Text style={{fontSize:13,color:c.muted,lineHeight:20}}>{completed?'You can now continue to the login screen.':stage==='otp'?`Enter the six-digit code sent to your registered email. It expires in ${Math.ceil(codeExpiresIn/60)} minutes. If you have switched to your phone to read the email, you can request a fresh code here after the resend timer.`:stage==='reset'?'This password will replace your previous password. Existing sessions will be revoked.':isChange?'Update your password using your current password, or verify your email if you no longer remember it.':'Enter the email address registered to your account. We will not reveal whether an account exists.'}</Text></View>
    {completed?<Card style={{gap:14}}><Row icon="checkmark-circle-outline" title="Password updated" subtitle={info}/><Button title="Continue to log in" icon="arrow-forward" onPress={continueToLogin}/></Card>:<>
      {stage==='request'&&isChange&&!forgotCurrent?<Card style={{gap:14}}>
        {passwordField('Current password',currentPassword,setCurrentPassword,'Enter current password')}
        <TouchableOpacity onPress={()=>setForgotCurrent(true)} accessibilityRole="checkbox" accessibilityState={{checked:false}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:5}}><Ionicons name="square-outline" size={21} color={c.blue}/><Text style={{flex:1,color:c.text,fontWeight:'700',fontSize:13}}>I don't remember my current password</Text></TouchableOpacity>
        {passwordField('New password',newPassword,setNewPassword,'Create a strong password')}
        {passwordField('Confirm new password',confirmPassword,setConfirmPassword,'Enter the new password again')}
        <Text style={{fontSize:11,color:c.muted,lineHeight:17}}>Use at least 8 characters with uppercase, lowercase, a number, and a special character. Passwords are limited to 72 UTF-8 bytes.</Text>
        <Button title={busy?'Updating…':'Change password'} icon="lock-closed-outline" disabled={busy} onPress={submitCurrentChange}/>
      </Card>:null}
      {stage==='request'&&(!isChange||forgotCurrent)?<Card style={{gap:14}}>
        {!isChange?<View style={{gap:7}}><Label>Registered email address</Label><Field value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email"/></View>:<TouchableOpacity onPress={()=>{setForgotCurrent(false);setError('');}} accessibilityRole="checkbox" accessibilityState={{checked:true}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:5}}><Ionicons name="checkbox" size={21} color={c.blue}/><Text style={{flex:1,color:c.text,fontWeight:'700',fontSize:13}}>I don't remember my current password</Text></TouchableOpacity>}
        <Button title={busy?'Please wait…':'Send verification code'} icon="mail-outline" disabled={busy||(!isChange&&!/^\S+@\S+\.\S+$/.test(email.trim()))} onPress={sendOtp}/>
      </Card>:null}
      {stage==='otp'?<Card style={{gap:14}}>
        <View style={{gap:7}}><Label>Six-digit email code</Label><Field value={code} onChangeText={value=>setCode(value.replace(/\D/g,'').slice(0,6))} placeholder="000000" keyboardType="number-pad" autoComplete="one-time-code" maxLength={6}/></View>
        <Button title={busy?'Verifying…':'Verify code'} icon="shield-checkmark-outline" disabled={busy||code.length!==6} onPress={verifyOtp}/>
        <TouchableOpacity disabled={seconds>0||busy} onPress={sendOtp} style={{alignSelf:'center',padding:8}}><Text style={{color:seconds>0?c.muted:c.blue,fontWeight:'800'}}>{seconds>0?`Resend code in ${seconds}s`:'Didn’t receive the email? Resend code'}</Text></TouchableOpacity>
      </Card>:null}
      {stage==='reset'?<Card style={{gap:14}}>
        {passwordField('New password',newPassword,setNewPassword,'Create a strong password')}
        {passwordField('Confirm new password',confirmPassword,setConfirmPassword,'Enter the new password again')}
        <Text style={{fontSize:11,color:c.muted,lineHeight:17}}>Use at least 8 characters with uppercase, lowercase, a number, and a special character.</Text>
        <Button title={busy?'Updating…':'Reset password'} icon="lock-closed-outline" disabled={busy} onPress={submitReset}/>
      </Card>:null}
    </>}
    {info&&!completed?<Card style={{padding:13,backgroundColor:c.surface2}}><Text style={{fontSize:12,color:c.text,lineHeight:18}}>{info}</Text></Card>:null}
    {error?<Card style={{padding:13,borderColor:'#F2C1C5',backgroundColor:'#FFF4F4'}}><Text style={{color:c.red,fontSize:13,lineHeight:19}}>{error}</Text></Card>:null}
  </Page>;
}

export function Home({navigation}) {
  const {user,transactions,offlineSession,privacyAccount}=useApp();
  const latest=transactions.slice(0,3);
  return <Page>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:4}}>
      <View style={{gap:5}}><Text style={{color:c.muted,fontSize:13}}>Welcome back</Text><Text style={{fontSize:23,fontWeight:'900',color:c.text}}>{user?.name||'MeshPay member'}</Text></View>
      <Avatar name={user?.name} size={48}/>
    </View>
    {offlineSession?<View style={{backgroundColor:'#FFF5DF',borderRadius:15,padding:13,flexDirection:'row',gap:9,alignItems:'center'}}><Ionicons name="cloud-offline-outline" size={19} color="#94650D"/><Text style={{flex:1,color:'#77591E',fontSize:12,lineHeight:18}}>Offline profile. Saved recipient lookups are available; online account actions need a connection.</Text></View>:null}
    <Card style={{backgroundColor:c.navy,borderColor:c.navy,padding:20,gap:14}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:'#CBD9E8',fontWeight:'700',fontSize:13}}>Available balance</Text><Ionicons name="eye-outline" size={19} color="#D4E5F4"/></View>
      <Text style={{color:c.white,fontSize:25,fontWeight:'900'}}>{privacyAccount?.hideBalance?'Hidden':'Not available'}</Text>
      <Text style={{color:'#B5C6D9',fontSize:12,lineHeight:18}}>{privacyAccount?.hideBalance?'Balance visibility is hidden by your privacy setting.':'A bank or payment provider is not connected, so no balance is displayed.'}</Text>
      <TouchableOpacity onPress={()=>navigation.navigate('Main',{screen:'Wallet'})} style={{alignSelf:'flex-start',backgroundColor:'#FFFFFF20',paddingVertical:10,paddingHorizontal:14,borderRadius:12}}><Text style={{color:c.white,fontWeight:'800',fontSize:12}}>Link a bank account</Text></TouchableOpacity>
    </Card>
    <View style={{flexDirection:'row',justifyContent:'space-between'}}>
      {[
        {icon:'arrow-up-outline',label:'Send',route:'Send',color:c.blue},
        {icon:'qr-code-outline',label:'Scan',route:'Scan',color:'#159C87'},
        {icon:'time-outline',label:'History',route:'History',color:'#6C63D9'},
        {icon:'git-network-outline',label:'Mesh',route:'Mesh',color:'#E18A31'},
      ].map(item=><TouchableOpacity key={item.label} onPress={()=>navigation.navigate(item.route)} style={{alignItems:'center',gap:8,minWidth:62}}>
        <View style={{width:52,height:52,borderRadius:18,backgroundColor:item.color,alignItems:'center',justifyContent:'center'}}><Ionicons name={item.icon} size={22} color={c.white}/></View>
        <Text style={{color:c.text,fontSize:12,fontWeight:'700'}}>{item.label}</Text>
      </TouchableOpacity>)}
    </View>
    <View style={{backgroundColor:'#E8F6F7',borderRadius:18,padding:16,flexDirection:'row',alignItems:'center',gap:13}}>
      <View style={{width:42,height:42,borderRadius:14,backgroundColor:'#D4F0F0',alignItems:'center',justifyContent:'center'}}><Ionicons name="git-network-outline" size={21} color={c.teal}/></View>
      <View style={{flex:1,gap:4}}><Text style={{color:c.teal,fontWeight:'800'}}>Offline payments</Text><Text style={{color:'#517276',fontSize:12,lineHeight:17}}>Device-to-device payment support is not active in this build.</Text></View>
    </View>
    <SectionTitle title="Recent activity" action="See all" onAction={()=>navigation.navigate('History')}/>
    {latest.length?latest.map((item,index)=><Txn key={item.id||index} item={item}/>):<EmptyState icon="receipt-outline" title="Payment history unavailable" message="No payment-provider-confirmed records are available. The internal mesh simulator is not bank settlement."/>}
  </Page>;
}

export function SendMoney({navigation,route}) {
  const {user,isAccountLocked}=useApp();
  const [mobileNumber,setMobileNumber]=useState(route?.params?.mobileNumber||''); const [amount,setAmount]=useState(''); const [note,setNote]=useState('');
  const [lookup,setLookup]=useState(null); const [lookupBusy,setLookupBusy]=useState(false); const [saving,setSaving]=useState(false);
  const [error,setError]=useState(''); const [saveMessage,setSaveMessage]=useState('');
  const requestId=useRef(0);
  useEffect(()=>{
    if(route?.params?.mobileNumber)changeNumber(route.params.mobileNumber);
  },[route?.params?.mobileNumber]);
  const changeNumber=value=>{requestId.current+=1;setMobileNumber(value);setLookup(null);setError('');setSaveMessage('');};
  const findRecipient=async()=>{
    const id=++requestId.current;setError('');setSaveMessage('');setLookup(null);
    try { normalizeMobileNumber(mobileNumber); }
    catch(e) { setError(e.message);return; }
    setLookupBusy(true);
    try {
      const result=await recipientLookupService.lookup(user?.id,mobileNumber);
      if(id===requestId.current)setLookup(result);
    } catch(e) {
      if(id===requestId.current)setError(e.message||'Enter a valid mobile number.');
    } finally { if(id===requestId.current)setLookupBusy(false); }
  };
  const saveForOffline=async()=>{
    if(!lookup?.recipient?.id)return;
    setSaving(true);setSaveMessage('');
    try {
      const result=await recipientLookupService.saveForOffline(user.id,lookup.recipient.id);
      setLookup(current=>current?{...current,savedForOffline:result.cached}:current);
      setSaveMessage(result.cached?'Saved for offline lookup on this device.': 'Saved to your account; local storage is unavailable on this device.');
    } catch(e) { setSaveMessage(e.message||'Could not save this recipient.'); }
    finally { setSaving(false); }
  };
  const continueToConfirm=()=>{
    if(isAccountLocked)return setError('This account is emergency locked. Unlock it in Privacy & Account before continuing.');
    const numeric=Number(amount);
    if(!lookup?.recipient)return setError('Find a recipient before continuing.');
    if(!Number.isFinite(numeric)||numeric<=0)return setError('Enter an amount greater than zero.');
    const typed=normalizeMobileNumber(mobileNumber);
    const actualMerchantUpiId=String(lookup.recipient.merchantUpiId||lookup.recipient.upiId||'').trim();
    const isDemoMerchantUpiId=!actualMerchantUpiId&&Boolean(DEMO_MERCHANT_UPI_ID);
    navigation.navigate('Confirm',{
      recipient:lookup.recipient.meshPayId||typed,
      recipientDisplayName:lookup.recipient.displayName||'',
      merchantUpiId:actualMerchantUpiId||DEMO_MERCHANT_UPI_ID||null,
      isDemoMerchantUpiId,
      amount:numeric,
      note:note.trim(),
      lookupStatus:lookup.status,
      lookupSource:lookup.source,
      lastSyncedAt:lookup.lastSyncedAt||lookup.checkedAt||null,
      isStale:Boolean(lookup.isStale),
    });
  };
  const found=lookup?.status===RecipientLookupStatus.SERVER_DATABASE_MATCH||lookup?.status===RecipientLookupStatus.LOCAL_CACHE_MATCH;
  return <Page>
    <Header title="Send money" back onBack={()=>navigation.goBack()}/>
    <View style={{gap:6}}><Text style={{fontSize:23,fontWeight:'900',color:c.text}}>Find a recipient</Text><Text style={{color:c.muted,fontSize:13,lineHeight:20}}>Search the app directory or saved recipients on this device.</Text></View>
    <View><Label>Recipient mobile number</Label><Field value={mobileNumber} onChangeText={changeNumber} placeholder="10-digit mobile number" keyboardType="phone-pad" returnKeyType="search" onSubmitEditing={findRecipient}/></View>
    <Button title={lookupBusy?'Finding recipient...':'Find recipient'} icon={lookupBusy?undefined:'search-outline'} disabled={lookupBusy||!user?.id} onPress={findRecipient}/>
    {lookup?.status===RecipientLookupStatus.SERVER_DATABASE_MATCH?<Card style={{gap:14,borderColor:'#B8DCCD'}}>
      <Row icon="person-circle-outline" title={lookup.recipient.displayName} subtitle="Found in the MeshPay app database" action={<Badge tone="green">APP RECORD</Badge>}/>
      <View style={{height:1,backgroundColor:c.line}}/>
      <Row icon="at-outline" title="MeshPay ID" subtitle={lookup.recipient.meshPayId||'Not provided'}/>
      <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>Not verified by OTP, a bank, or a live UPI provider.</Text>
      {lookup.savedForOffline?<Badge tone="green">SAVED FOR OFFLINE LOOKUP</Badge>:<Button title={saving?'Saving...':'Save for offline lookup'} variant="outline" icon="bookmark-outline" disabled={saving} onPress={saveForOffline}/>}
    </Card>:null}
    {lookup?.status===RecipientLookupStatus.LOCAL_CACHE_MATCH?<Card style={{gap:14,borderColor:lookup.isStale?'#E8D29E':'#B8DCCD'}}>
      <Row icon="person-circle-outline" title={lookup.recipient.displayName} subtitle="Saved recipient found on this device" action={<Badge tone={lookup.isStale?'amber':'green'}>{lookup.isStale?'STALE':'LOCAL CACHE'}</Badge>}/>
      <Row icon="at-outline" title="MeshPay ID" subtitle={lookup.recipient.meshPayId||'Not provided'}/>
      <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>Identity not verified by a bank. Saved information may not reflect the current owner of this number.</Text>
      <Text style={{color:c.muted,fontSize:11}}>Last sync: {lookup.lastSyncedAt?new Date(lookup.lastSyncedAt).toLocaleString():'Unknown'}</Text>
      {lookup.isStale?<Text style={{color:'#94650D',fontSize:12,fontWeight:'700'}}>This saved record is over 30 days old. Verify the recipient before continuing.</Text>:null}
    </Card>:null}
    {lookup?.status===RecipientLookupStatus.NOT_FOUND?<EmptyState icon="person-remove-outline" title="Recipient not found" message="No discoverable record for this number was found in the MeshPay app database."/>:null}
    {lookup?.status===RecipientLookupStatus.LOOKUP_UNAVAILABLE?<EmptyState icon="cloud-offline-outline" title="Lookup unavailable" message="The recipient service could not be reached, and there is no matching saved recipient on this device."/>:null}
    {error?<Text style={{color:c.red,fontSize:13}}>{error}</Text>:null}
    {saveMessage?<Text style={{color:c.muted,fontSize:12}}>{saveMessage}</Text>:null}
    {found?<View style={{gap:12}}>
      <View><Label>Amount</Label><View style={{flexDirection:'row',alignItems:'center',height:62,borderWidth:1,borderColor:c.line,borderRadius:16,backgroundColor:c.surface,paddingHorizontal:16,gap:8}}><Text style={{color:c.text,fontSize:22,fontWeight:'800'}}>₹</Text><Field value={amount} onChangeText={value=>{setAmount(value.replace(/[^0-9.]/g,''));setError('');}} keyboardType="decimal-pad" placeholder="0.00" style={{flex:1,height:58,borderWidth:0,backgroundColor:'transparent',paddingHorizontal:0,fontSize:22,fontWeight:'800'}}/></View></View>
      <View style={{flexDirection:'row',gap:8}}>{['100','200','500','1000'].map(value=><TouchableOpacity key={value} onPress={()=>setAmount(value)} style={{flex:1,paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:c.line,backgroundColor:amount===value?'#E5F0FF':c.surface,alignItems:'center'}}><Text style={{fontSize:12,color:amount===value?c.blue:c.text,fontWeight:'700'}}>₹{Number(value).toLocaleString('en-IN')}</Text></TouchableOpacity>)}</View>
      <View><Label>Note (optional)</Label><Field value={note} onChangeText={setNote} placeholder="What's this for?" maxLength={50}/></View>
      {isAccountLocked?<Text style={{color:c.red,fontSize:12,lineHeight:18}}>Payments are blocked while this account is locked.</Text>:null}
      <Button title="Review transfer" icon="arrow-forward" disabled={isAccountLocked} onPress={continueToConfirm}/>
    </View>:null}
    <View style={{backgroundColor:c.surface2,borderRadius:15,padding:14,flexDirection:'row',gap:10,alignItems:'center'}}><Ionicons name="information-circle-outline" size={20} color={c.blue}/><Text style={{flex:1,color:c.muted,fontSize:12,lineHeight:18}}>Recipient lookup only identifies an app record. It does not verify a bank account or payment address. No transfer can be sent until a PSP/acquirer is connected.</Text></View>
  </Page>;
}

export function Confirm({navigation,route}) {
  const {recipient='',recipientDisplayName='',merchantUpiId=null,isDemoMerchantUpiId=false,amount=0,note='',lookupStatus='',lookupSource='',lastSyncedAt=null,isStale=false}=route.params||{}; const {isAccountLocked}=useApp(); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [intentDispatchedAt,setIntentDispatchedAt]=useState(null);
  const sourceLabel=lookupSource===RecipientDataSource.LOCAL_DEVICE_CACHE?'Saved on this device':lookupSource===RecipientDataSource.APPLICATION_DATABASE?'MeshPay app database':'Recipient source unavailable';
  const prepare=async()=>{if(isAccountLocked){setMessage('This account is emergency locked. Unlock it before paying.');return;}setBusy(true);setMessage('');try{await paymentsService.prepare({receiverVpa:recipient,amount,note});}catch(error){setMessage(error.message||'Payment provider configuration is pending. No money was sent.');}finally{setBusy(false);}};
  return <Page>
    <Header title="Review transfer" back onBack={()=>navigation.goBack()}/>
    <View style={{alignItems:'center',gap:8,paddingVertical:16}}><Avatar name={recipientDisplayName||recipient} size={62}/><Text style={{fontSize:18,fontWeight:'900',color:c.text}}>{recipientDisplayName||'Recipient'}</Text><Text style={{color:c.muted,fontSize:13}}>{recipient}</Text><Text style={{fontSize:32,fontWeight:'900',color:c.text,marginTop:8}}>₹{Number(amount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</Text>{note?<Text style={{color:c.muted}}>{note}</Text>:null}</View>
    <Card style={{gap:16}}><Row icon="person-circle-outline" title="Recipient information" subtitle={`${sourceLabel} · UPI ID not independently verified`}/><Row icon="card-outline" title="Payment method" subtitle={merchantUpiId?"External UPI app intent":"No UPI ID or payment provider available"}/><Row icon="shield-checkmark-outline" title="Transfer status" subtitle="This app cannot confirm an external UPI payment"/></Card>
    <View style={{backgroundColor:isStale?"#FFF5DF":"#EAF2FF",borderColor:isStale?"#E8D29E":"#CCDCF2",borderWidth:1,borderRadius:15,padding:14,flexDirection:"row",gap:10}}><Ionicons name="alert-circle-outline" size={20} color={isStale?"#94650D":c.blue}/><Text style={{flex:1,color:isStale?"#77591E":c.muted,fontSize:12,lineHeight:19}}>{isStale?"This recipient was saved more than 30 days ago. Confirm their details before any real transfer. ":""}{merchantUpiId?"Review the UPI ID and amount in the external payment app before approving.":"No UPI ID is available. This screen cannot initiate or settle a payment."}</Text></View>
    {lastSyncedAt?<Text style={{color:c.muted,fontSize:11,textAlign:'center'}}>Recipient record last synced {new Date(lastSyncedAt).toLocaleString()} · {lookupStatus===RecipientLookupStatus.LOCAL_CACHE_MATCH?'local cache':'app directory'}</Text>:null}
    {merchantUpiId?<Card style={{gap:12,borderColor:isDemoMerchantUpiId?"#E8D29E":c.line}}>
      <Row icon="at-outline" title={isDemoMerchantUpiId?"Development demo UPI ID":"UPI ID"} subtitle={merchantUpiId} action={<Badge tone={isDemoMerchantUpiId?"amber":"blue"}>{isDemoMerchantUpiId?"DEMO · UNVERIFIED":"UNVERIFIED"}</Badge>}/>
      <Text style={{color:isDemoMerchantUpiId?"#77591E":c.muted,fontSize:12,lineHeight:18}}>{isDemoMerchantUpiId?"This fallback is only for development. It is not a sandbox payment address and may open a real UPI app. ":"Verify the UPI ID in the payment app before approving."}Only the UPI app or payment provider can confirm whether money was transferred.</Text>
      <UpiIntentButton merchantUpiId={merchantUpiId} merchantName={recipientDisplayName||"MeshPay recipient"} amount={amount} isDemo={isDemoMerchantUpiId} disabled={isAccountLocked} onIntentDispatched={({dispatchedAt})=>setIntentDispatchedAt(dispatchedAt)}/>
    </Card>:null}
    {intentDispatchedAt?<Text style={{color:c.muted,textAlign:"center",fontSize:12}}>UPI intent opened at {new Date(intentDispatchedAt).toLocaleTimeString()}. Payment status is not confirmed.</Text>:null}
    {message?<Text style={{color:c.red,textAlign:'center',fontSize:13}}>{message}</Text>:null}
    {isAccountLocked?<Text style={{color:c.red,fontSize:13,textAlign:'center'}}>Payments are disabled because this account is emergency locked.</Text>:null}
    {!merchantUpiId?<Button title={busy?"Checking...":"Check payment availability"} icon={busy?undefined:"arrow-forward"} disabled={busy||isAccountLocked} onPress={prepare}/>:null}
  </Page>;
}

export function Mesh() {
  const [status,setStatus]=useState(()=>meshService.getStatus());
  const bubbleProgress=useRef([new Animated.Value(0),new Animated.Value(0),new Animated.Value(0)]).current;
  useEffect(()=>{
    const subscription=meshService.subscribeToConnectionState(setStatus);
    setStatus(meshService.getStatus());
    return ()=>subscription?.remove();
  },[]);
  useEffect(()=>{
    if(!status.connected){bubbleProgress.forEach(progress=>progress.stopAnimation(()=>progress.setValue(0)));return;}
    const loops=bubbleProgress.map((progress,index)=>Animated.loop(Animated.sequence([
      Animated.delay(index*360),
      Animated.timing(progress,{toValue:1,duration:1500,useNativeDriver:true}),
      Animated.timing(progress,{toValue:0,duration:0,useNativeDriver:true}),
    ])));
    loops.forEach(loop=>loop.start());
    return ()=>loops.forEach(loop=>loop.stop());
  },[status.connected,bubbleProgress]);
  return <Page>
    <Header title="Mesh network"/>
    <View style={{backgroundColor:c.navy,borderRadius:24,padding:24,alignItems:'center',gap:16}}>
      <View style={{height:164,width:164,borderRadius:82,borderWidth:1,borderColor:status.connected?'#31B9D0':'#1D5577',backgroundColor:'#0E2A47',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
        {status.connected?bubbleProgress.map((progress,index)=>{
          const drift=index===0?-46:index===1?0:46;
          return <Animated.View key={index} pointerEvents="none" style={{position:'absolute',left:78,top:78,width:8,height:8,borderRadius:4,backgroundColor:index===1?'#7BE8F2':'#46B9DC',opacity:progress.interpolate({inputRange:[0,0.15,1],outputRange:[0,0.9,0]}),transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[0,drift]})},{translateY:progress.interpolate({inputRange:[0,1],outputRange:[0,-58]})},{scale:progress.interpolate({inputRange:[0,0.5,1],outputRange:[0.5,1.25,0.7]})}]}}/>;
        }):null}
        <View style={{width:66,height:66,borderRadius:22,backgroundColor:status.connected?'#145268':'#164164',alignItems:'center',justifyContent:'center'}}><Ionicons name="git-network-outline" size={32} color={status.connected?'#75F0F2':c.cyan}/></View>
        <View style={{position:'absolute',top:21,left:72}}><Ionicons name="phone-portrait-outline" size={20} color="#77BDD4"/></View>
        <View style={{position:'absolute',bottom:22,left:28}}><Ionicons name="phone-portrait-outline" size={20} color="#77BDD4"/></View>
        <View style={{position:'absolute',bottom:22,right:28}}><Ionicons name="phone-portrait-outline" size={20} color="#77BDD4"/></View>
      </View>
      <Text style={{fontSize:19,fontWeight:'900',color:c.white}}>{status.connected?'Live device mesh':'Device mesh preview'}</Text>
      <Text style={{color:'#BDD0E2',fontSize:13,textAlign:'center',lineHeight:20}}>{status.message} {status.connected?'Live connection activity is shown above.':'Bubbles appear only while a device is connected.'}</Text>
      <Badge tone={status.connected?'green':'amber'}>{status.connected?'CONNECTED':'NOT ACTIVE'}</Badge>
    </View>
    <SectionTitle title="Connected devices"/>
    {status.connected?status.devices.map((device,index)=><Card key={String(device.id||device.deviceId||index)} style={{marginBottom:10}}><Row icon="phone-portrait-outline" title={device.name||device.deviceName||`Bluetooth device ${index+1}`} subtitle={device.id||device.deviceId||'Connected over Bluetooth'}/></Card>):<EmptyState icon="phone-portrait-outline" title="No devices connected" message="Real device discovery will appear here when native Bluetooth mesh support is added."/>}
  </Page>;
}

export function Scan({navigation}) {
  return <Page>
    <Header title="Scan & pay" back onBack={()=>navigation.goBack()}/>
    <EmptyState icon="qr-code-outline" title="UPI QR payments are not connected" message="A payment QR can only be shown after PSP/acquirer onboarding and verified recipient settlement routing. No QR or payment address is generated here."/>
    <Button title="Find an app recipient" icon="search-outline" onPress={()=>navigation.navigate('Send')}/>
  </Page>;
}

export function Request({navigation}) {
  return <Page><Header title="Request money" back onBack={()=>navigation.goBack()}/><EmptyState icon="qr-code-outline" title="Payment requests are unavailable" message="No payment QR or address can be generated until an authorized PSP/acquirer onboards this application and verifies recipient settlement routing."/></Page>;
}

export function Notifications({navigation}) {
  const {refreshNotificationCount}=useApp();
  const [items,setItems]=useState([]);
  const pageRef=useRef(0);
  const [hasNext,setHasNext]=useState(false);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState('');
  const [busyId,setBusyId]=useState(null);

  const load=useCallback(async({append=false,refresh=false}={})=>{
    if(refresh)setRefreshing(true);else if(!append)setLoading(true);
    setError('');
    const requestedPage=append?pageRef.current:0;
    try {
      const result=await notificationsApiService.list(requestedPage,50);
      setItems(current=>append?[...current,...(result?.items||[])]:result?.items||[]);
      pageRef.current=Number(result?.page)||0;
      setHasNext(Boolean(result?.hasNext));
      await refreshNotificationCount();
    } catch(e) { setError(e.message||'Could not load notifications. Check your connection and try again.'); }
    finally { setLoading(false);setRefreshing(false); }
  },[refreshNotificationCount]);

  useFocusEffect(useCallback(()=>{load();},[load]));

  const markRead=async id=>{
    setBusyId(id);
    try {
      const updated=await notificationsApiService.markRead(id);
      setItems(current=>current.map(item=>item.id===id?updated:item));
      await refreshNotificationCount();
    } catch(e) { setError(e.message||'Could not mark this notification as read.'); }
    finally { setBusyId(null); }
  };
  const markAllRead=async()=>{
    setBusyId('all');
    try {
      await notificationsApiService.markAllRead();
      const readAt=new Date().toISOString();
      setItems(current=>current.map(item=>({...item,read:true,readAt:item.readAt||readAt})));
      await refreshNotificationCount();
    } catch(e) { setError(e.message||'Could not mark notifications as read.'); }
    finally { setBusyId(null); }
  };
  const deleteNotification=id=>{
    const remove=async()=>{
      setBusyId(id);
      try { await notificationsApiService.remove(id);setItems(current=>current.filter(item=>item.id!==id));await refreshNotificationCount(); }
      catch(e) { setError(e.message||'Could not delete this notification.'); }
      finally { setBusyId(null); }
    };
    if(Platform.OS==='web'&&typeof window!=='undefined') {
      if(window.confirm('Delete this notification from your history?'))remove();
    } else Alert.alert('Delete notification?','This removes it from your notification history.',[
      {text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:remove},
    ]);
  };

  return <Page refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load({refresh:true})} tintColor={c.blue} colors={[c.blue]}/> }>
    <Header title="Notifications" back onBack={()=>navigation.goBack()}/>
    <SectionTitle title="Payment history" action={items.some(item=>!item.read)?'Mark all read':undefined} onAction={markAllRead}/>
    {loading?<View style={{paddingVertical:24,alignItems:'center'}}><ActivityIndicator color={c.blue}/><Text style={{color:c.muted,marginTop:10}}>Loading notification history…</Text></View>:null}
    {!loading&&!items.length&&!error?<EmptyState icon="notifications-outline" title="No notifications yet" message="Payment notifications will appear here after the backend confirms a successful settlement."/>:null}
    {items.map(item=><Card key={item.id} style={{gap:12,borderColor:item.read?c.line:c.blue,backgroundColor:item.read?c.surface:c.surface2}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
        <View style={{width:40,height:40,borderRadius:14,backgroundColor:item.read?c.surface2:'#DCEBFF',alignItems:'center',justifyContent:'center'}}><Ionicons name="arrow-down-circle-outline" size={23} color={c.green}/></View>
        <View style={{flex:1,gap:3}}><Text style={{color:c.text,fontWeight:'900',fontSize:14}}>{item.senderName} sent you ₹{Number(item.amount||0).toLocaleString('en-IN',{minimumFractionDigits:2})}</Text><Text style={{color:c.muted,fontSize:11}}>{item.createdAt?new Date(item.createdAt).toLocaleString():'Date unavailable'}</Text></View>
        {!item.read?<View style={{width:9,height:9,borderRadius:5,backgroundColor:c.red}}/>:null}
      </View>
      <Text style={{color:c.muted,fontSize:12}}>Transaction ID: {item.transactionId}</Text>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <Badge tone={item.paymentStatus==='SETTLED'?'green':'amber'}>{item.paymentStatus==='SETTLED'?'SETTLED · internal ledger':item.paymentStatus}</Badge>
        <View style={{flexDirection:'row',gap:14}}>
          {!item.read?<TouchableOpacity disabled={Boolean(busyId)} onPress={()=>markRead(item.id)} accessibilityRole="button"><Text style={{color:c.blue,fontWeight:'800',fontSize:12}}>{busyId===item.id?'Saving…':'Mark as read'}</Text></TouchableOpacity>:null}
          <TouchableOpacity disabled={Boolean(busyId)} onPress={()=>deleteNotification(item.id)} accessibilityRole="button" accessibilityLabel="Delete notification"><Text style={{color:c.red,fontWeight:'800',fontSize:12}}>Delete</Text></TouchableOpacity>
        </View>
      </View>
    </Card>)}
    {hasNext?<Button title="Load older notifications" variant="outline" disabled={Boolean(busyId)} onPress={()=>load({append:true})}/>:null}
    {error?<Text accessibilityRole="alert" style={{color:c.red,fontSize:12,lineHeight:18}}>{error}</Text>:null}
  </Page>;
}

export function History({navigation}) {
  const {transactions,filter,setFilter}=useApp();
  const rows=useMemo(()=>transactions.filter(item=>filter==='All'||item.direction===filter),[transactions,filter]);
  return <Page><Header title="Transaction history"/><Text style={{color:c.muted,fontSize:13}}>Internal mesh simulator records are shown as demo-ledger activity, not bank settlements.</Text>
    <View style={{flexDirection:'row',gap:8,backgroundColor:c.surface2,padding:5,borderRadius:14}}>{['All','Sent','Received'].map(value=><TouchableOpacity key={value} onPress={()=>setFilter(value)} style={{flex:1,backgroundColor:filter===value?c.navy:'transparent',padding:11,borderRadius:10,alignItems:'center'}}><Text style={{color:filter===value?c.white:c.muted,fontWeight:'800',fontSize:12}}>{value}</Text></TouchableOpacity>)}</View>
    {rows.length?rows.map((item,index)=><Txn key={item.id||index} item={item} navigation={navigation}/>):<EmptyState icon="receipt-outline" title="Payment history unavailable" message="No provider-confirmed payments are available. No bank settlement is reported by this build."/>}
  </Page>;
}

function Txn({item,navigation}) {
  const sent=item.direction==='Sent';
  const amount=item.detailsHidden?'Hidden':item.amount==null?'Unavailable':`₹${Number(item.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}`;
  return <TouchableOpacity activeOpacity={navigation?0.75:1} onPress={()=>navigation?.navigate('Details',{item})}>
    <Card style={{padding:13}}><View style={{flexDirection:'row',alignItems:'center',gap:12}}>
      <View style={{width:44,height:44,borderRadius:16,backgroundColor:sent?'#FFF0F1':'#E9F8F1',alignItems:'center',justifyContent:'center'}}><Ionicons name={sent?'arrow-up-outline':'arrow-down-outline'} size={20} color={sent?c.red:c.green}/></View>
      <View style={{flex:1,gap:4}}><Text numberOfLines={1} style={{color:c.text,fontWeight:'800'}}>{item.contact||'Transaction'}</Text><Text style={{color:c.muted,fontSize:11}}>{item.date||'Date unavailable'} · {item.direction||'Activity'}</Text></View>
      <View style={{alignItems:'flex-end',gap:5}}><Text style={{color:c.text,fontWeight:'900'}}>{amount}</Text><Text style={{color:c.muted,fontSize:10}}>{item.status||'Status unavailable'}</Text></View>
    </View></Card>
  </TouchableOpacity>;
}

export function Details({navigation,route}) {
  const item=route.params?.item;
  return <Page><Header title="Transaction details" back onBack={()=>navigation.goBack()}/>{item?<><Txn item={item}/><Card style={{gap:13}}><Row icon="swap-horizontal-outline" title="Direction" subtitle={item.direction||'Not provided'}/><Row icon="calendar-outline" title="Date" subtitle={item.date||'Not provided'}/><Row icon="information-circle-outline" title="Status" subtitle={item.status||'Not provided'}/></Card></>:<EmptyState icon="receipt-outline" title="Transaction not found" message="There are no details available for this item."/>}</Page>;
}

export function Profile({navigation}) {
  const {user,setUser,offlineSession,setOfflineSession}=useApp();
  const [discoverability,setDiscoverability]=useState(null); const [savingDiscoverability,setSavingDiscoverability]=useState(false); const [discoverabilityMessage,setDiscoverabilityMessage]=useState('');
  useEffect(()=>{
    let active=true;
    if(user?.id&&!offlineSession)recipientLookupService.getDiscoverability().then(result=>{if(active)setDiscoverability(result);}).catch(()=>{if(active)setDiscoverabilityMessage('Could not load recipient lookup settings.');});
    return()=>{active=false;};
  },[user?.id,offlineSession]);
  const updateDiscoverability=async enabled=>{
    setSavingDiscoverability(true);setDiscoverabilityMessage('');
    try { const result=await recipientLookupService.setDiscoverability(enabled);setDiscoverability(result); }
    catch { setDiscoverabilityMessage('Could not update this setting. Check your connection and try again.'); }
    finally { setSavingDiscoverability(false); }
  };
  const logout=async()=>{await authService.logout();setUser(null);setOfflineSession(false);navigation.getParent()?.reset({index:0,routes:[{name:'Splash'}]});};
  return <Page><Header title="Profile" right={<TouchableOpacity onPress={()=>navigation.navigate('Settings')} accessibilityRole="button" accessibilityLabel="Open Privacy and Account settings" hitSlop={8} style={{width:44,height:44,borderRadius:22,backgroundColor:c.blue,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:c.cyan,shadowColor:c.navy,shadowOpacity:0.16,shadowRadius:5,shadowOffset:{width:0,height:2},elevation:3}}><Ionicons name="settings-sharp" size={23} color={c.white}/></TouchableOpacity>}/>
    {user?<Card style={{alignItems:'center',gap:9,padding:22}}><Avatar name={user.name} size={68}/><Text style={{color:c.text,fontSize:20,fontWeight:'900'}}>{user.name}</Text><Text style={{color:c.muted,fontSize:13}}>{user.email}</Text>{user.phone?<Text style={{color:c.muted,fontSize:13}}>{user.phone}</Text>:null}</Card>:<EmptyState icon="person-circle-outline" title="Profile unavailable" message="Log in to view your account profile."/>}
    <Card style={{gap:13}}>
      <Row icon="phone-portrait-outline" title="Recipient lookup" subtitle={discoverability?.enabled?'Your MeshPay record is discoverable':'Your record is hidden from recipient lookup'} action={<Switch value={Boolean(discoverability?.enabled)} onValueChange={updateDiscoverability} disabled={!discoverability||offlineSession||savingDiscoverability} trackColor={{false:c.line,true:'#A5D9CB'}} thumbColor={discoverability?.enabled?c.green:c.white}/>}/>
      <Text style={{color:c.muted,fontSize:12,lineHeight:19}}>When enabled, signed-in MeshPay users searching your exact mobile number can see your name and MeshPay ID. This app does not verify phone ownership by OTP or verify identity with a bank.</Text>
      {offlineSession?<Text style={{color:'#94650D',fontSize:12}}>Reconnect to manage this setting.</Text>:null}
      {discoverabilityMessage?<Text style={{color:c.red,fontSize:12}}>{discoverabilityMessage}</Text>:null}
    </Card>
    <Card style={{gap:17}}>
      <TouchableOpacity onPress={()=>navigation.navigate('Main',{screen:'Wallet'})}><Row icon="card-outline" title="Bank accounts" subtitle="Manage linked accounts" action={<Ionicons name="chevron-forward" size={18} color={c.muted}/>} /></TouchableOpacity>
      <Row icon="shield-checkmark-outline" title="Security" subtitle="Account password and privacy" action={<Ionicons name="chevron-forward" size={18} color={c.muted}/>} />
      <Row icon="help-circle-outline" title="Help & support" subtitle="Get help with your account" action={<Ionicons name="chevron-forward" size={18} color={c.muted}/>} />
      <Row icon="information-circle-outline" title="About MeshPay" subtitle="Offline payment project" action={<Ionicons name="chevron-forward" size={18} color={c.muted}/>} />
    </Card>
    <TouchableOpacity onPress={logout} style={{height:52,borderRadius:15,backgroundColor:'#FFF0F1',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8}}><Ionicons name="log-out-outline" size={19} color={c.red}/><Text style={{color:c.red,fontWeight:'800'}}>Log out</Text></TouchableOpacity>
  </Page>;
}

export function Settings({navigation}) {
  const {settings,updateSettings,resolvedTheme,privacyAccount,updatePrivacyAccount,refreshPrivacyAccount,
    isAccountLocked,lockSyncPending,setAccountLockLocally,markAccountLockSynchronized}=useApp();
  const [permission,setPermission]=useState('unsupported');
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);
  const [accountLoading,setAccountLoading]=useState(true);
  const [devices,setDevices]=useState([]);
  const [syncStatus,setSyncStatus]=useState(null);
  const [currentDeviceId,setCurrentDeviceId]=useState(null);
  const [registerPassword,setRegisterPassword]=useState('');
  const [customLimit,setCustomLimit]=useState('');
  const [confirmLock,setConfirmLock]=useState(false);
  const [confirmDeviceId,setConfirmDeviceId]=useState(null);
  const [unlockPassword,setUnlockPassword]=useState('');
  const [accountBusy,setAccountBusy]=useState(false);
  const [deleteModal,setDeleteModal]=useState(false);
  const [deleteStage,setDeleteStage]=useState('confirm');
  const [deleteAcknowledged,setDeleteAcknowledged]=useState(false);
  const [deleteOtp,setDeleteOtp]=useState('');
  const [deleteChallenge,setDeleteChallenge]=useState(null);
  const [deleteCountdown,setDeleteCountdown]=useState(0);
  const [deletionRequest,setDeletionRequest]=useState(null);
  const [deletionError,setDeletionError]=useState('');
  const notificationSupport=notificationsService.isSupported();

  const reloadAccount=async()=>{
    setAccountLoading(true);
    const results=await Promise.allSettled([
      refreshPrivacyAccount(),privacyAccountService.devices(),privacyAccountService.syncStatus(),deviceIdentityService.getIdentity(),
    ]);
    if(results[0].status==='rejected')setMessage(results[0].reason?.message||'Could not load account privacy settings.');
    if(results[1].status==='fulfilled')setDevices(results[1].value);
    if(results[1].status==='rejected')setMessage(results[1].reason?.message||'Could not load linked devices.');
    if(results[2].status==='fulfilled')setSyncStatus(results[2].value);
    if(results[3].status==='fulfilled')setCurrentDeviceId(results[3].value.deviceId);
    setAccountLoading(false);
  };

  useEffect(()=>{notificationsService.getPermission().then(setPermission);reloadAccount();accountDeletionService.status().then(setDeletionRequest).catch(()=>{});},[]);
  useEffect(()=>{if(deleteCountdown<=0)return;const timer=setTimeout(()=>setDeleteCountdown(value=>Math.max(0,value-1)),1000);return()=>clearTimeout(timer);},[deleteCountdown]);

  const openDeleteFlow=()=>{setDeleteAcknowledged(false);setDeleteOtp('');setDeleteChallenge(null);setDeleteStage('confirm');setDeleteModal(true);};
  const sendDeleteOtp=async(previousChallengeId=null)=>{
    setAccountBusy(true);setDeletionError('');
    try {const result=await accountDeletionService.sendOtp(previousChallengeId);setDeleteChallenge(result);setDeleteCountdown(result.expiresInSeconds||60);setDeleteStage('otp');}
    catch(error){setDeletionError(error.message||'Could not send a verification code.');}
    finally{setAccountBusy(false);}
  };
  const submitDeleteOtp=async()=>{
    if(!/^\d{6}$/.test(deleteOtp))return setDeletionError('Enter the six-digit verification code sent to you.');
    setAccountBusy(true);setDeletionError('');
    try {const result=await accountDeletionService.verifyAndRequest(deleteChallenge.challengeId,deleteOtp);setDeletionRequest(result);setDeleteStage('submitted');setDeleteCountdown(result.remainingSeconds||0);setDeleteOtp('');await refreshPrivacyAccount().catch(()=>{});}
    catch(error){if(error.status===409){setDeleteStage('pending');setDeletionError(error.message);}else setDeletionError(error.message||'Could not verify the code.');}
    finally{setAccountBusy(false);}
  };

  const chooseTheme=async theme=>{
    setSaving(true);setMessage('');
    const saved=await updateSettings({theme});
    setSaving(false);
    setMessage(saved?'Theme preference saved.':'Could not save this preference on this device.');
  };

  const savePrivacy=async patch=>{
    setAccountBusy(true);setMessage('');
    try { await updatePrivacyAccount(patch);setMessage('Privacy preference saved to your account.'); }
    catch(error) { setMessage(error.message||'Could not save this preference. Reconnect and try again.'); }
    finally { setAccountBusy(false); }
  };

  const chooseLimit=value=>{
    const amount=Number(value);
    if(!Number.isFinite(amount)||amount<0||amount>50000)return setMessage('Enter a limit from ₹0 to ₹50,000.');
    savePrivacy({offlinePaymentLimit:amount});
  };

  const lockAccount=async()=>{
    setAccountBusy(true);setMessage('');
    try {
      await setAccountLockLocally(true,true);
      const result=await privacyAccountService.lock();
      await markAccountLockSynchronized();
      await refreshPrivacyAccount();
      setConfirmLock(false);
      setMessage(result.accountLocked?'Emergency lock is active on the server. Payments are blocked.':'The server did not confirm the account lock.');
    } catch(error) {
      setMessage(`This device is locked locally. Server synchronization is pending${error?.message?`: ${error.message}`:'.'}`);
    } finally { setAccountBusy(false); }
  };

  const unlockAccount=async()=>{
    if(!unlockPassword)return setMessage('Enter your account password to unlock.');
    setAccountBusy(true);setMessage('');
    try {
      const result=await privacyAccountService.unlock(unlockPassword);
      if(result.accountLocked)throw new Error('The server still reports this account as locked.');
      await setAccountLockLocally(false,false);
      await refreshPrivacyAccount();
      setUnlockPassword('');
      setMessage('Account unlocked after password verification.');
    } catch(error) { setMessage(error.message||'Could not verify your password or unlock the account.'); }
    finally { setAccountBusy(false); }
  };

  const revokeDevice=async deviceId=>{
    setAccountBusy(true);setMessage('');
    try {
      await privacyAccountService.revokeDevice(deviceId);
      setConfirmDeviceId(null);
      setDevices(await privacyAccountService.devices());
      setMessage('Device access revoked. Its existing sessions can no longer authenticate.');
    } catch(error) { setMessage(error.message||'Could not revoke this device.'); }
    finally { setAccountBusy(false); }
  };

  const registerCurrentDevice=async()=>{
    if(!registerPassword)return setMessage('Enter your account password to verify this device.');
    setAccountBusy(true);setMessage('');
    try {
      const identity=await deviceIdentityService.getIdentity();
      await privacyAccountService.registerDevice(registerPassword,identity);
      setRegisterPassword('');
      await reloadAccount();
      setMessage('This device was registered after password verification.');
    } catch(error) { setMessage(error.message||'Could not verify and register this device.'); }
    finally { setAccountBusy(false); }
  };

  const toggleNotifications=async enabled=>{
    setMessage('');
    if(!notificationSupport) {
      setMessage('Notifications are not supported on this platform.');
      return;
    }
    setSaving(true);
    try {
      if(enabled) {
        const result=await notificationsService.requestPermission();
        setPermission(result);
        if(result!=='granted') {
          setMessage(result==='denied'?'Notifications are blocked in device settings.':'Notification permission was not granted.');
          return;
        }
        const saved=await updateSettings({notificationsEnabled:true});
        if(!saved){setMessage('Could not save this preference on this device.');return;}
        if(Platform.OS!=='web') {
          try { await notificationsService.registerPushToken(true,settings.notificationSoundEnabled); }
          catch(error) { setMessage(`Notification preference saved. ${error.message}`);return; }
        }
        setMessage('Payment notifications enabled on this device.');
      } else {
        if(Platform.OS!=='web')await notificationsService.registerPushToken(false,settings.notificationSoundEnabled).catch(()=>{});
        const saved=await updateSettings({notificationsEnabled:false});
        setMessage(saved?'Payment notifications disabled on this device.':'Could not save this preference on this device.');
      }
    } finally { setSaving(false); }
  };
  const toggleNotificationSound=async enabled=>{
    setSaving(true);setMessage('');
    try {
      const saved=await updateSettings({notificationSoundEnabled:enabled});
      if(!saved){setMessage('Could not save the sound preference on this device.');return;}
      if(settings.notificationsEnabled&&Platform.OS!=='web') {
        try { await notificationsService.registerPushToken(true,enabled); }
        catch(error) { setMessage(`Sound preference saved locally. ${error.message}`);return; }
      }
      setMessage(enabled?'Notification sounds enabled.':'Notification sounds disabled.');
    } finally { setSaving(false); }
  };

  const sendTestNotification=async()=>{
    const sent=await notificationsService.sendTest().catch(()=>false);
    setMessage(sent?'A test notification was sent by your browser.':'Allow notifications in your browser first.');
  };

  const themes=[
    {id:'system',title:'System',subtitle:`Follow your device (${resolvedTheme})`,icon:'phone-portrait-outline'},
    {id:'light',title:'Light',subtitle:'Bright background and dark text',icon:'sunny-outline'},
    {id:'dark',title:'Dark',subtitle:'Dim background for low-light use',icon:'moon-outline'},
  ];

  const limits=[0,100,250,500,1000,2000,5000];
  return <Page><Header title="Privacy & Account"/>
    <Card style={{gap:12}}><SectionTitle title="Account security"/><Row icon="key-outline" title="Change password" subtitle="Update your password or recover access by email"/><Button title="Change password" icon="lock-closed-outline" variant="outline" onPress={()=>navigation.navigate('PasswordRecovery',{mode:'change'})}/></Card>
    <View style={{gap:5}}><Text style={{color:c.text,fontSize:22,fontWeight:'900'}}>Privacy & account controls</Text><Text style={{color:c.muted,fontSize:13,lineHeight:19}}>Account security and privacy preferences are stored by your signed-in account.</Text></View>
    {accountLoading?<Card style={{flexDirection:'row',gap:10,alignItems:'center'}}><ActivityIndicator color={c.blue}/><Text style={{color:c.muted}}>Loading your account controls…</Text></Card>:null}
    {!accountLoading&&privacyAccount?<View style={{gap:11}}>
      <SectionTitle title="Offline payment limit"/>
      <Card style={{gap:13}}>
        <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>This is a 24-hour server-side limit for app-account packets that reach the mesh settlement simulator. It is not a bank-funded wallet or a guarantee that offline transfers are available.</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{limits.map(value=>{
          const selected=Number(privacyAccount.offlinePaymentLimit)===value;
          return <TouchableOpacity key={value} onPress={()=>chooseLimit(value)} disabled={accountBusy} accessibilityRole="radio" accessibilityState={{checked:selected}} style={{paddingVertical:10,paddingHorizontal:13,borderRadius:12,borderWidth:1,borderColor:selected?c.blue:c.line,backgroundColor:selected?c.surface2:c.surface}}><Text style={{color:selected?c.blue:c.text,fontSize:12,fontWeight:'800'}}>{value===0?'Off':`₹${value.toLocaleString('en-IN')}`}</Text></TouchableOpacity>;
        })}</View>
        <View style={{flexDirection:'row',gap:9,alignItems:'center'}}><TextInput value={customLimit} onChangeText={value=>setCustomLimit(value.replace(/[^0-9.]/g,''))} placeholder="Custom amount" keyboardType="decimal-pad" placeholderTextColor={c.muted} style={{flex:1,minHeight:48,borderRadius:12,borderWidth:1,borderColor:c.line,paddingHorizontal:12,color:c.text,backgroundColor:c.bg}}/><View style={{width:124}}><Button title="Save custom" variant="outline" disabled={accountBusy||!customLimit} onPress={()=>chooseLimit(customLimit)}/></View></View>
        <View style={{backgroundColor:c.surface2,borderRadius:13,padding:13,gap:5}}><Text style={{color:c.text,fontWeight:'800'}}>Last 24 hours</Text><Text style={{color:c.muted,fontSize:12}}>Limit: ₹{Number(privacyAccount.offlinePaymentLimit||0).toLocaleString('en-IN')}  ·  Used: ₹{Number(privacyAccount.offlineSpentLast24Hours||0).toLocaleString('en-IN')}</Text><Text style={{color:c.blue,fontWeight:'900'}}>Remaining allowance: ₹{Number(privacyAccount.remainingOfflineAllowance||0).toLocaleString('en-IN')}</Text></View>
      </Card>
    </View>:null}
    {!accountLoading&&privacyAccount?<Card style={{gap:13}}>
      <SectionTitle title="Transaction privacy"/>
      <Row icon="eye-off-outline" title="Hide balance" subtitle={privacyAccount.hideBalance?'Balance visibility is hidden':'Hide balance amounts on account screens'} action={<Switch value={Boolean(privacyAccount.hideBalance)} onValueChange={enabled=>savePrivacy({hideBalance:enabled})} disabled={accountBusy} trackColor={{false:c.line,true:'#A5D9CB'}} thumbColor={privacyAccount.hideBalance?c.green:c.white}/>}/>
      <View style={{height:1,backgroundColor:c.line}}/>
      <Row icon="receipt-outline" title="Hide transaction details" subtitle={privacyAccount.hideTransactionDetails?'Amounts and counterparties are redacted by the server':'Hide amounts and counterparties in your history'} action={<Switch value={Boolean(privacyAccount.hideTransactionDetails)} onValueChange={enabled=>savePrivacy({hideTransactionDetails:enabled})} disabled={accountBusy} trackColor={{false:c.line,true:'#A5D9CB'}} thumbColor={privacyAccount.hideTransactionDetails?c.green:c.white}/>}/>
    </Card>:null}
    <View style={{gap:11}}>
      <SectionTitle title="Trusted devices"/>
      {currentDeviceId&&!devices.some(device=>device.deviceId===currentDeviceId)?<Card style={{gap:10}}><Row icon="shield-checkmark-outline" title="Register this device" subtitle="This existing session needs a fresh password check before it can be managed"/><TextInput value={registerPassword} onChangeText={setRegisterPassword} placeholder="Account password" placeholderTextColor={c.muted} secureTextEntry autoCapitalize="none" style={{minHeight:48,borderRadius:12,borderWidth:1,borderColor:c.line,paddingHorizontal:12,color:c.text,backgroundColor:c.bg}}/><Button title={accountBusy?'Verifying…':'Verify and register device'} disabled={accountBusy||!registerPassword} onPress={registerCurrentDevice}/></Card>:null}
      {devices.length?devices.map(device=><Card key={device.deviceId} style={{gap:11}}>
        <Row icon="phone-portrait-outline" title={device.deviceName} subtitle={`${device.platform.toUpperCase()} · ${device.revokedAt?'Revoked':`Last active ${new Date(device.lastActiveAt).toLocaleString()}`}`}/>
        <Text selectable style={{color:c.muted,fontSize:11}}>Device ID: {device.deviceId}</Text>
        <Text style={{color:c.muted,fontSize:11}}>Password-verified: {new Date(device.registeredAt).toLocaleString()}</Text>
        {confirmDeviceId===device.deviceId?<View style={{gap:10,backgroundColor:c.surface2,padding:12,borderRadius:12}}><Text style={{color:c.text,fontSize:13}}>Revoke this device and all sessions registered to it?</Text><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button title="Cancel" variant="secondary" onPress={()=>setConfirmDeviceId(null)}/></View><View style={{flex:1}}><Button title="Confirm revoke" variant="outline" disabled={accountBusy} onPress={()=>revokeDevice(device.deviceId)}/></View></View></View>:<Button title={device.revokedAt?'Revoked':device.deviceId===currentDeviceId?'This device':'Remove device'} variant="outline" disabled={accountBusy||Boolean(device.revokedAt)||device.deviceId===currentDeviceId} onPress={()=>setConfirmDeviceId(device.deviceId)}/>}
      </Card>):!accountLoading?<EmptyState icon="phone-portrait-outline" title="No device records returned" message="Sign out and sign in again to register this installation after password verification."/>:null}
    </View>
    <Card style={{gap:13,borderColor:isAccountLocked?c.red:c.line}}>
      <SectionTitle title="Emergency account lock"/>
      <Row icon={isAccountLocked?'lock-closed':'lock-open-outline'} title={isAccountLocked?'Account locked':'Account unlocked'} subtitle={isAccountLocked?'Payment authorization is blocked on this device and by the server':'Lock the account if this device or account may be at risk'}/>
      {lockSyncPending?<Text style={{color:'#94650D',fontSize:12,lineHeight:18}}>Local emergency lock is active. Server sync will retry automatically when this device can reach your account.</Text>:null}
      {isAccountLocked?<>
        <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>To unlock, enter your account password. This is checked by the server; local state is cleared only after it confirms the unlock.</Text>
        <TextInput value={unlockPassword} onChangeText={setUnlockPassword} placeholder="Account password" placeholderTextColor={c.muted} secureTextEntry autoCapitalize="none" style={{minHeight:50,borderRadius:12,borderWidth:1,borderColor:c.line,paddingHorizontal:13,color:c.text,backgroundColor:c.bg}}/>
        <Button title={accountBusy?'Verifying…':'Verify password and unlock'} disabled={accountBusy||!unlockPassword} onPress={unlockAccount}/>
      </>:confirmLock?<View style={{gap:10,backgroundColor:c.surface2,padding:12,borderRadius:12}}><Text style={{color:c.text,fontSize:13,lineHeight:19}}>Confirm emergency lock. This immediately blocks payment actions on this device and asks the server to lock your account.</Text><View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button title="Cancel" variant="secondary" disabled={accountBusy} onPress={()=>setConfirmLock(false)}/></View><View style={{flex:1}}><Button title={accountBusy?'Locking…':'Confirm lock'} variant="outline" disabled={accountBusy} onPress={lockAccount}/></View></View></View>:<Button title="Emergency lock account" icon="lock-closed-outline" variant="outline" disabled={accountBusy} onPress={()=>setConfirmLock(true)}/>}
    </Card>
    <Card style={{gap:12}}>
      <SectionTitle title="Automatic settlement & sync"/>
      {syncStatus?<Row icon={syncStatus.available?'sync-circle-outline':'cloud-offline-outline'} title={syncStatus.available?'Sync available':'Sync unavailable in this build'} subtitle={syncStatus.reason}/>:<ActivityIndicator color={c.blue}/>}
      <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>The app has no native Bluetooth mesh client, sender signing keys, or approved payment settlement integration. No offline transaction is queued or shown as settled.</Text>
    </Card>
    <View style={{gap:11}}>
      <SectionTitle title="Appearance"/>
      {themes.map(option=>{
        const selected=settings.theme===option.id;
        return <TouchableOpacity key={option.id} onPress={()=>chooseTheme(option.id)} disabled={saving} accessibilityRole="radio" accessibilityState={{checked:selected}}>
          <Card style={{padding:14,borderColor:selected?c.blue:c.line,backgroundColor:selected?c.surface2:c.surface,flexDirection:'row',alignItems:'center',gap:12}}>
            <View style={{width:42,height:42,borderRadius:14,backgroundColor:selected?c.blue:c.surface2,alignItems:'center',justifyContent:'center'}}><Ionicons name={option.icon} size={19} color={selected?c.white:c.blue}/></View>
            <View style={{flex:1,gap:3}}><Text style={{color:c.text,fontSize:14,fontWeight:'800'}}>{option.title}</Text><Text style={{color:c.muted,fontSize:12}}>{option.subtitle}</Text></View>
            <Ionicons name={selected?'checkmark-circle':'ellipse-outline'} size={21} color={selected?c.blue:c.muted}/>
          </Card>
        </TouchableOpacity>;
      })}
    </View>
    <View style={{gap:11}}>
      <SectionTitle title="Notifications"/>
      <Card style={{gap:13}}>
        <Row icon="notifications-outline" title={Platform.OS==='web'?'Browser notifications':'Payment notifications'} subtitle={Platform.OS==='web'?'Allow browser notification banners':'Receive settled-payment alerts on this device'} action={<Switch value={Boolean(settings.notificationsEnabled&&permission==='granted')} onValueChange={toggleNotifications} disabled={!notificationSupport||saving} trackColor={{false:c.line,true:'#A5D9CB'}} thumbColor={settings.notificationsEnabled&&permission==='granted'?c.green:c.white}/>}/>
        <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>{Platform.OS==='web'?'Browser permission only; remote payment push delivery is available in the native app.':'Background push uses Expo Push through FCM/APNs. An EAS project ID and push credentials are required for a development or production build.'}</Text>
        <Row icon="volume-high-outline" title="Notification sound" subtitle={settings.notificationSoundEnabled?'Play the device sound for new payment alerts':'Payment alerts will be silent'} action={<Switch value={Boolean(settings.notificationSoundEnabled)} onValueChange={toggleNotificationSound} disabled={!settings.notificationsEnabled||saving} trackColor={{false:c.line,true:'#A5D9CB'}} thumbColor={settings.notificationSoundEnabled?c.green:c.white}/>}/>
        {settings.notificationsEnabled&&permission==='granted'?<Button title="Send test notification" variant="outline" icon="paper-plane-outline" onPress={sendTestNotification}/>:null}
        {permission==='denied'?<Text style={{color:c.red,fontSize:12,lineHeight:18}}>Notifications are blocked in device or browser settings. Allow them there, then enable notifications again.</Text>:null}
      </Card>
    </View>
    <Card style={{gap:12,borderColor:'#F3B6BC'}}>
      <SectionTitle title="Account deletion"/>
      {deletionRequest?.status==='PENDING_DELETION'?<>
        <Text style={{color:c.text,fontSize:13,lineHeight:20}}>Your deletion request is pending. Logging in during the 72-hour grace period cancels it.</Text>
        <Text style={{color:c.muted,fontSize:12}}>Requested: {new Date(deletionRequest.requestCreatedAt).toLocaleString()}</Text>
        <Text style={{color:c.muted,fontSize:12}}>Scheduled: {new Date(deletionRequest.scheduledDeletionAt).toLocaleString()}</Text>
        <Text style={{color:c.blue,fontWeight:'800'}}>Remaining: {Math.floor((deletionRequest.remainingSeconds||0)/3600)}h {Math.floor(((deletionRequest.remainingSeconds||0)%3600)/60)}m</Text>
      </>:<Button title="Delete Account" icon="trash-outline" variant="danger" disabled={accountBusy} onPress={openDeleteFlow}/>}
    </Card>
    {message?<Text accessibilityRole="status" style={{color:message.startsWith('Could not')||message.includes('failed')?c.red:c.muted,fontSize:12,lineHeight:18}}>{message}</Text>:null}
    <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={()=>{if(deleteStage==='confirm')setDeleteModal(false);}}>
      <View style={{flex:1,backgroundColor:'rgba(5,20,40,.58)',justifyContent:'center',padding:22}}>
        <Card style={{gap:14,borderRadius:22,padding:20}}>
          <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Ionicons name="trash-outline" size={22} color={c.red}/><Text style={{fontSize:20,fontWeight:'900',color:c.text,flex:1}}>{deleteStage==='confirm'?'Delete Account':deleteStage==='otp'?'Verify your account':deleteStage==='submitted'?'Deletion request submitted':deleteStage==='pending'?'Payments pending':'Account deletion'}</Text><TouchableOpacity onPress={()=>setDeleteModal(false)} accessibilityLabel="Close"><Ionicons name="close" size={22} color={c.muted}/></TouchableOpacity></View>
          {deleteStage==='confirm'?<>
            <Text style={{color:c.muted,lineHeight:21}}>Are you sure you want to delete your account? This action will initiate the account deletion process.</Text>
            <TouchableOpacity onPress={()=>setDeleteAcknowledged(value=>!value)} accessibilityRole="checkbox" accessibilityState={{checked:deleteAcknowledged}} style={{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:5}}><Ionicons name={deleteAcknowledged?'checkbox':'square-outline'} size={22} color={deleteAcknowledged?c.blue:c.muted}/><Text style={{color:c.text,flex:1,lineHeight:20}}>I understand that I want to permanently delete my account.</Text></TouchableOpacity>
            {deletionError?<Text style={{color:c.red,lineHeight:19}}>{deletionError}</Text>:null}
            <View style={{flexDirection:'row',gap:9}}><View style={{flex:1}}><Button title="Cancel" variant="secondary" onPress={()=>setDeleteModal(false)}/></View><View style={{flex:1}}><Button title={accountBusy?'Sending…':'Continue'} disabled={!deleteAcknowledged||accountBusy} onPress={()=>sendDeleteOtp()}/></View></View>
          </>:null}
          {deleteStage==='otp'?<>
            <Text style={{color:c.muted,lineHeight:21}}>{deleteChallenge?.deliveryMode==='EMAIL'
              ? `The code was sent to your registered email${deleteChallenge?.maskedDestination?` (${deleteChallenge.maskedDestination})`:''}.`
              : `An OTP has been sent to your registered mobile number ending with ${deleteChallenge?.maskedDestination?.slice(-4)||'XXXX'}.`}</Text>
            <TextInput value={deleteOtp} onChangeText={value=>setDeleteOtp(value.replace(/\D/g,'').slice(0,6))} placeholder="Six-digit code" keyboardType="number-pad" maxLength={6} placeholderTextColor={c.muted} style={{minHeight:52,borderRadius:13,borderWidth:1,borderColor:c.line,paddingHorizontal:14,color:c.text,backgroundColor:c.bg,fontSize:18,letterSpacing:4}}/>
            <Text style={{color:c.muted,fontSize:12}}>{deleteCountdown>0?`Code expires in ${deleteCountdown}s`:"Code expired. Request a new code."}</Text>
            {deletionError?<Text style={{color:c.red,lineHeight:19}}>{deletionError}</Text>:null}
            <Button title={accountBusy?'Verifying…':'Verify code'} disabled={accountBusy||deleteOtp.length!==6||deleteCountdown===0} onPress={submitDeleteOtp}/>
            <TouchableOpacity disabled={accountBusy||deleteCountdown>0} onPress={()=>sendDeleteOtp(deleteChallenge?.challengeId)} style={{alignItems:'center',padding:8}}><Text style={{color:deleteCountdown>0?c.muted:c.blue,fontWeight:'800'}}>Resend code {deleteCountdown>0?`(${deleteCountdown}s)`:''}</Text></TouchableOpacity>
          </>:null}
          {deleteStage==='pending'?<><Text style={{color:c.red,lineHeight:21}}>{message||'Your account cannot be deleted right now because some payments are still pending. Please wait until all pending payments are completed or resolved, then try again.'}</Text><Button title="Back to Settings" onPress={()=>setDeleteModal(false)}/></>:null}
          {deleteStage==='submitted'?<>
            <Text style={{color:c.text,lineHeight:21}}>Your account deletion request has been successfully submitted.{ '\n\n' }Your account will be permanently deleted within 72 hours.{ '\n\n' }IMPORTANT: Please do not log in using this registered email address during the next 72 hours. If you log in during this period, your account deletion request will be cancelled.</Text>
            <Text style={{color:c.muted,fontSize:12}}>Requested: {deletionRequest?.requestCreatedAt?new Date(deletionRequest.requestCreatedAt).toLocaleString():''}</Text>
            <Text style={{color:c.muted,fontSize:12}}>Scheduled: {deletionRequest?.scheduledDeletionAt?new Date(deletionRequest.scheduledDeletionAt).toLocaleString():''}</Text>
            <Text style={{color:c.blue,fontWeight:'900'}}>Time remaining: {Math.floor(deleteCountdown/3600)}h {Math.floor((deleteCountdown%3600)/60)}m {deleteCountdown%60}s</Text>
            <Button title="Done" onPress={()=>setDeleteModal(false)}/>
          </>:null}
        </Card>
      </View>
    </Modal>
  </Page>;
}

export function BankAccounts() {
  const {user,privacyAccount}=useApp();
  const [accounts,setAccounts]=useState([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState(false);
  const [stage,setStage]=useState('idle'); const [message,setMessage]=useState(''); const [messageTone,setMessageTone]=useState('info');
  const [integrationStatus,setIntegrationStatus]=useState(null); const [balanceMessage,setBalanceMessage]=useState('');
  const [mobile,setMobile]=useState(''); const [challenge,setChallenge]=useState(null); const [otp,setOtp]=useState('');
  const [secondsRemaining,setSecondsRemaining]=useState(0); const [selectedBank,setSelectedBank]=useState('');
  const [bankSearch,setBankSearch]=useState('');
  const [otherBankName,setOtherBankName]=useState('');
  const [holderName,setHolderName]=useState(''); const [accountNumber,setAccountNumber]=useState('');
  const [confirmAccountNumber,setConfirmAccountNumber]=useState('');
  const [ifsc,setIfsc]=useState('');
  const [pendingAccountId,setPendingAccountId]=useState(null);
  const [confirmRemoveId,setConfirmRemoveId]=useState(null);
  const banks=[
    'State Bank of India','HDFC Bank','ICICI Bank','Axis Bank','Punjab National Bank',
    'Bank of Baroda','Kotak Mahindra Bank','Canara Bank','Union Bank of India',
    'Bank of India','Indian Bank','Indian Overseas Bank','Central Bank of India',
    'UCO Bank','IDBI Bank','IDFC FIRST Bank','Federal Bank','IndusInd Bank',
    'Yes Bank','RBL Bank','South Indian Bank','Bandhan Bank','AU Small Finance Bank',
    'Other supported bank',
  ];
  const bankSearchAliases={
    'State Bank of India':'SBI',
    'Punjab National Bank':'PNB',
    'Bank of Baroda':'BOB BOBI',
    'Kotak Mahindra Bank':'Kotak',
    'Union Bank of India':'UBI',
    'Bank of India':'BOI',
    'Indian Overseas Bank':'IOB',
    'Central Bank of India':'CBI',
    'IDFC FIRST Bank':'IDFC First',
    'South Indian Bank':'SIB',
    'AU Small Finance Bank':'AU Bank',
  };

  useEffect(()=>{
    try { setMobile(normalizeMobileNumber(user?.phone)); } catch { setMobile(''); }
  },[user?.phone]);

  const loadAccounts=async()=>{
    setLoading(true);
    try {
      const result=await bankAccountsService.list();
      setAccounts(Array.isArray(result)?result:[]);
    } catch {
      setMessage('Could not load linked bank accounts. Check your connection and try again.');
      setMessageTone('error');
    } finally { setLoading(false); }
  };
  const loadIntegrationStatus=async()=>{
    try { setIntegrationStatus(await bankAccountsService.integrationStatus()); }
    catch { setIntegrationStatus(null); }
  };
  useEffect(()=>{loadAccounts();loadIntegrationStatus();},[]);

  const otpReady=integrationStatus?.mobileOtp?.status==='CONFIGURED_NOT_LIVE_VALIDATED';
  const [otpDeliveryMode,setOtpDeliveryMode]=useState(
    String(integrationStatus?.mobileOtp?.provider||'').toLowerCase().includes('email')?'EMAIL':'SMS');
  const [maskedOtpDestination,setMaskedOtpDestination]=useState('');
  useEffect(()=>{
    setOtpDeliveryMode(String(integrationStatus?.mobileOtp?.provider||'').toLowerCase().includes('email')?'EMAIL':'SMS');
  },[integrationStatus?.mobileOtp?.provider]);
  const bankVerificationReady=['CONFIGURED_NOT_LIVE_VALIDATED','SANDBOX_CONFIGURED_NOT_LIVE']
    .includes(integrationStatus?.bankVerification?.status);
  const balanceReady=integrationStatus?.balanceEnquiry?.status==='ACTIVE';
  const paymentsReady=integrationStatus?.paymentsAndQr?.status==='ACTIVE';

  useEffect(()=>{
    if(stage!=='otp'||secondsRemaining<=0)return undefined;
    const timer=setTimeout(()=>setSecondsRemaining(value=>Math.max(0,value-1)),1000);
    return ()=>clearTimeout(timer);
  },[stage,secondsRemaining]);

  const showError=error=>{
    setMessage(error?.message||'The request could not be completed. Try again.');
    setMessageTone('error');
  };
  const beginLink=()=>{
    setMessage('');
    setChallenge(null); setOtp(''); setSelectedBank(''); setBankSearch(''); setOtherBankName('');
    setAccountNumber(''); setConfirmAccountNumber(''); setHolderName(''); setIfsc('');
    setConfirmRemoveId(null);
    setStage('mobile');
  };
  const cancelLink=()=>{
    setStage('idle');
    setMessage('');
    setChallenge(null);
    setOtp('');
    setSecondsRemaining(0);
    setAccountNumber('');
    setIfsc('');
    setConfirmAccountNumber('');
    setPendingAccountId(null);
  };
  const requestOtp=async(resend=false)=>{
    const normalizedMobile=mobile.replace(/\D/g,'');
    if(!/^\d{10}$/.test(normalizedMobile)) {
      setMessage('Enter the registered 10-digit mobile number.');
      setMessageTone('error');
      return;
    }
    setBusy(true);setMessage('');
    try {
      const result=await bankAccountsService.sendOtp(normalizedMobile,resend?challenge?.challengeId:undefined);
      setChallenge(result);setOtp('');setSecondsRemaining(result.expiresInSeconds);
      setStage('otp');
      const mode=String(result?.deliveryMode||'SMS').toUpperCase();
      setOtpDeliveryMode(mode);
      setMaskedOtpDestination(result?.maskedDestination||'');
      setMessage(mode==='EMAIL'
        ? `The code was sent to your registered email${result?.maskedDestination?` (${result.maskedDestination})`:''}.`
        : 'The SMS provider accepted the request. Enter the code sent to your registered mobile.');
      setMessageTone('success');
    } catch(error) { showError(error); }
    finally { setBusy(false); }
  };
  const verifyOtp=async()=>{
    if(!/^\d{6}$/.test(otp)) {
      setMessage('Enter the 6-digit OTP.');
      setMessageTone('error');
      return;
    }
    setBusy(true);setMessage('');
    try {
      await bankAccountsService.verifyOtp(challenge.challengeId,otp);
      setStage('bank');setMessage(otpDeliveryMode==='EMAIL'
        ? 'Registered email verified.' : 'Mobile number verified by the SMS provider.');
      setMessageTone('success');
    } catch(error) { showError(error); }
    finally { setBusy(false); }
  };
  const createAccount=async()=>{
    const bankName=selectedBank==='Other supported bank'?otherBankName.trim():selectedBank;
    const digits=accountNumber.replace(/\D/g,'');
    const confirmedDigits=confirmAccountNumber.replace(/\D/g,'');
    if(!bankName) {
      setMessage('Choose a supported bank and enter its name if selecting Other.');
      setMessageTone('error');return;
    }
    if(!holderName.trim()) {
      setMessage('Enter the account holder name.');
      setMessageTone('error');return;
    }
    if(!/^\d{9,18}$/.test(digits)) {
      setMessage('Account number must contain 9 to 18 digits.');
      setMessageTone('error');return;
    }
    if(digits!==confirmedDigits) {
      setMessage('The account numbers do not match.');
      setMessageTone('error');return;
    }
    const normalizedIfsc=ifsc.trim().toUpperCase();
    if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      setMessage('Enter the 11-character IFSC required by Cashfree bank verification.');
      setMessageTone('error');return;
    }
    setBusy(true);setMessage('');
    let createdAccountId=null;
    try {
      const pending=await bankAccountsService.link({
        challengeId:challenge.challengeId,
        bankName,
        accountHolderName:holderName.trim(),
        accountNumber:digits,
        confirmAccountNumber:confirmedDigits,
      });
      createdAccountId=pending.id;
      setPendingAccountId(pending.id);
      setStage('details');
      setMessage('Account submitted. Waiting for the bank verification provider.');
      setMessageTone('info');
      const verified=await bankAccountsService.verify(pending.id,digits,normalizedIfsc);
      await loadAccounts();
      setMessage(verified.verificationMessage||`Provider verification status: ${verified.verificationStatus}.`);
      setMessageTone(verified.verificationStatus==='VERIFIED'?'success'
        :verified.verificationStatus==='PENDING'?'info':'error');
      setStage('idle');setPendingAccountId(null);
      setAccountNumber('');setConfirmAccountNumber('');setIfsc('');
    } catch(error) {
      if(createdAccountId) {
        setPendingAccountId(createdAccountId);
        setStage('details');
        await loadAccounts();
        setMessage('Verification did not complete. Check the provider status before retrying.');
        setMessageTone('error');
      } else {
        await loadAccounts();
        showError(error);
      }
      setAccountNumber('');
      setConfirmAccountNumber('');
    } finally { setBusy(false); }
  };
  const verifyPending=async(account)=>{
    const digits=accountNumber.replace(/\D/g,'');
    const normalizedIfsc=ifsc.trim().toUpperCase();
    if(!/^\d{9,18}$/.test(digits)||!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedIfsc)) {
      setMessage('Re-enter the account number and the 11-character IFSC to continue verification.');
      setMessageTone('error');setPendingAccountId(account.id);setSelectedBank(account.bankName);setStage('details');return;
    }
    setBusy(true);
    try {
      const result=await bankAccountsService.verify(account.id,digits,normalizedIfsc);
      await loadAccounts();setPendingAccountId(null);setStage('idle');
      setAccountNumber('');setIfsc('');
      setMessage(result.verificationMessage||`Provider verification status: ${result.verificationStatus}.`);
      setMessageTone(result.verificationStatus==='VERIFIED'?'success'
        :result.verificationStatus==='PENDING'?'info':'error');
    } catch(error) {
      setAccountNumber('');
      showError(error);
    }
    finally { setBusy(false); }
  };
  const removeAccount=async accountId=>{
    setBusy(true);
    try {
      await bankAccountsService.remove(accountId);
      setAccounts(current=>current.filter(account=>account.id!==accountId));
      setConfirmRemoveId(null);
      setMessage('Bank account removed.');setMessageTone('success');
    } catch(error) { showError(error); }
    finally { setBusy(false); }
  };
  const normalizedBankSearch=bankSearch.trim().toLowerCase();
  const visibleBanks=banks.filter(bank=>`${bank} ${bankSearchAliases[bank]||''}`.toLowerCase().includes(normalizedBankSearch));
  const statusTone=status=>status==='VERIFIED'?'green':status==='FAILED'?'red':'amber';
  const checkBalance=async()=>{
    setBalanceMessage('');
    try { await bankAccountsService.checkBalance(); }
    catch(error) { setBalanceMessage(error.message||'Balance enquiry is not configured.'); }
  };
  const generateQr=async()=>{
    try { await paymentsService.generateQr(); }
    catch(error) { setMessage(error.message||'Payment QR generation is not configured.');setMessageTone('error'); }
  };

  return <Page><Header title="Wallet"/>
    <Card style={{backgroundColor:c.navy,borderColor:c.navy,gap:10}}>
      <Text style={{color:'#C5D6E7',fontWeight:'700',fontSize:13}}>BANK BALANCE</Text>
      <Text style={{color:c.white,fontSize:24,fontWeight:'900'}}>{privacyAccount?.hideBalance?'Hidden':'Unavailable'}</Text>
      <Text style={{color:'#C5D6E7',fontSize:12,lineHeight:18}}>{privacyAccount?.hideBalance?'Balance visibility is hidden by your privacy setting.':'Balance access needs approved Account Aggregator production access and your explicit consent. No balance is estimated or simulated.'}</Text>
      <Button title="Check Bank Balance" variant="outline" disabled={!balanceReady||busy} onPress={checkBalance}/>
      {balanceMessage?<Text style={{color:'#FFD6D6',fontSize:12}}>{balanceMessage}</Text>:null}
    </Card>
    <Card style={{gap:10}}>
      <SectionTitle title="My payment QR"/>
      <Text style={{color:c.muted,fontSize:13,lineHeight:19}}>No payment address or QR is generated until an authorized PSP/acquirer onboards the app and confirms each user's settlement destination.</Text>
      <Button title="Generate payment QR" variant="outline" disabled={!paymentsReady||busy} onPress={generateQr}/>
      <Text style={{color:c.muted,fontSize:11}}>Scanning a QR never transfers money by itself; the payer must approve the payment in their UPI app.</Text>
    </Card>
    <SectionTitle title="Linked accounts"/>
    {loading?<Text style={{color:c.muted}}>Loading your bank accounts...</Text>
      :accounts.length?accounts.map(account=><Card key={account.id} style={{gap:10}}>
        <Row icon="business-outline" title={account.bankName} subtitle={account.accountHolderName}/>
        <Text style={{color:c.text,fontWeight:'700',letterSpacing:1}}>{account.maskedAccountNumber}</Text>
        <Badge tone={statusTone(account.verificationStatus)}>{account.verificationStatus} · {account.verificationMode}</Badge>
        {account.verificationMessage?<Text style={{color:c.muted,fontSize:12,lineHeight:18}}>{account.verificationMessage}</Text>:null}
        {account.verificationStatus==='PENDING'?<Button title="Continue verification" variant="outline" disabled={busy} onPress={()=>verifyPending(account)}/>:null}
        {confirmRemoveId===account.id?<View style={{gap:9,backgroundColor:c.surface2,padding:12,borderRadius:12}}>
          <Text style={{color:c.text,fontSize:13}}>Remove this linked account?</Text>
          <View style={{flexDirection:'row',gap:9}}>
            <View style={{flex:1}}><Button title="Cancel" variant="secondary" disabled={busy} onPress={()=>setConfirmRemoveId(null)}/></View>
            <View style={{flex:1}}><Button title={busy?'Removing...':'Confirm remove'} variant="outline" disabled={busy} onPress={()=>removeAccount(account.id)}/></View>
          </View>
        </View>:<TouchableOpacity disabled={busy} onPress={()=>setConfirmRemoveId(account.id)} accessibilityRole="button">
          <Text style={{color:c.red,fontWeight:'800'}}>Remove account</Text>
        </TouchableOpacity>}
      </Card>):<EmptyState icon="card-outline" title="No bank accounts linked" message="Your verified accounts will appear here."/>}
    <View style={{backgroundColor:c.surface2,borderRadius:15,padding:14,flexDirection:'row',gap:10}}>
      <Ionicons name="information-circle-outline" size={19} color={c.blue}/>
      <Text style={{flex:1,color:c.muted,fontSize:12,lineHeight:18}}>Production setup status: {integrationStatus?.mobileOtp?.provider||'OTP'} {integrationStatus?.mobileOtp?.status||'unavailable'}; bank verification {integrationStatus?.bankVerification?.status||'unavailable'}; Account Aggregator {integrationStatus?.balanceEnquiry?.status||'unavailable'}; payments/QR {integrationStatus?.paymentsAndQr?.status||'unavailable'}. Credentials alone do not confirm provider approval.</Text>
    </View>
    {stage!=='idle'?<Card style={{gap:14}}>
      <SectionTitle title={stage==='mobile'?'Verify your mobile':stage==='otp'?'Enter verification code':stage==='bank'?'Choose your bank':'Account details'}/>
      {stage==='mobile'?<>
        <Label>Registered 10-digit mobile number</Label>
        <Field value={mobile} onChangeText={value=>setMobile(value.replace(/\D/g,'').slice(0,10))} placeholder="10-digit mobile number" keyboardType="phone-pad" maxLength={10}/>
        {!otpReady?<Text style={{color:c.muted,fontSize:12,lineHeight:18}}>OTP delivery is unavailable until a provider is configured. No development code is generated or displayed.</Text>:null}
        <Button title={busy?'Sending code...':otpDeliveryMode==='EMAIL'?'Send OTP by email':'Send OTP by SMS'} disabled={busy||!otpReady} onPress={()=>requestOtp(false)}/>
      </>:null}
      {stage==='otp'?<>
        <Text style={{color:c.muted,lineHeight:20}}>{otpDeliveryMode==='EMAIL'
          ? `Enter the 6-digit code sent to your registered email${maskedOtpDestination?` (${maskedOtpDestination})`:''}.`
          : 'Enter the 6-digit code delivered by SMS to your registered mobile number.'} {secondsRemaining>0?`Code expires in ${secondsRemaining} seconds.`:'This code has expired. Request a new code.'}</Text>
        <Field value={otp} onChangeText={value=>setOtp(value.replace(/\D/g,'').slice(0,6))} placeholder="6-digit OTP" keyboardType="number-pad" maxLength={6}/>
        <Button title={busy?'Checking...':secondsRemaining<=0?'Code expired':'Verify OTP'} disabled={busy||secondsRemaining<=0} onPress={verifyOtp}/>
        <TouchableOpacity disabled={busy||!otpReady||secondsRemaining>0} onPress={()=>requestOtp(true)} accessibilityRole="button">
          <Text style={{textAlign:'center',fontWeight:'800',color:secondsRemaining>0?c.muted:c.blue}}>
            {secondsRemaining>0?`Resend code in ${secondsRemaining}s`:'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </>:null}
      {stage==='bank'?<>
        <View style={{justifyContent:'center'}}>
          <Ionicons name="search-outline" size={18} color={c.muted} style={{position:'absolute',left:14,zIndex:1}}/>
          <TextInput value={bankSearch} onChangeText={setBankSearch} placeholder="Search by bank name" placeholderTextColor={c.muted} accessibilityLabel="Search banks by name" returnKeyType="search" style={{minHeight:50,borderRadius:13,backgroundColor:c.surface,borderColor:c.line,borderWidth:1,paddingLeft:42,paddingRight:bankSearch?44:14,color:c.text,fontSize:15}}/>
          {bankSearch?<TouchableOpacity onPress={()=>setBankSearch('')} accessibilityRole="button" accessibilityLabel="Clear bank search" hitSlop={8} style={{position:'absolute',right:12,padding:5}}>
            <Ionicons name="close-circle" size={20} color={c.muted}/>
          </TouchableOpacity>:null}
        </View>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{maxHeight:280}} contentContainerStyle={{gap:8,paddingBottom:2}}>
          {visibleBanks.map(bank=>{
            const selected=selectedBank===bank;
            return <TouchableOpacity key={bank} onPress={()=>setSelectedBank(bank)} accessibilityRole="radio" accessibilityLabel={bank} accessibilityState={{checked:selected}} style={{minHeight:58,paddingHorizontal:11,paddingVertical:8,borderRadius:13,backgroundColor:selected?'#EAF2FF':c.surface,borderWidth:1,borderColor:selected?c.blue:c.line,flexDirection:'row',alignItems:'center',gap:11}}>
              <BankMark bank={bank}/>
              <Text numberOfLines={2} style={{flex:1,color:c.text,fontWeight:'700',fontSize:13}}>{bank}</Text>
              <Ionicons name={selected?'radio-button-on':'radio-button-off'} size={20} color={selected?c.blue:c.muted}/>
            </TouchableOpacity>;
          })}
          {!visibleBanks.length?<Text style={{color:c.muted,paddingVertical:12}}>No matching banks. Try another name or abbreviation.</Text>:null}
        </ScrollView>
        {!bankVerificationReady?<Text style={{color:c.muted,fontSize:12,lineHeight:18}}>Cashfree Secure ID bank verification is unavailable until its Secure ID API keys, server encryption key, and approved environment are configured.</Text>:null}
        {integrationStatus?.bankVerification?.status==='SANDBOX_CONFIGURED_NOT_LIVE'?<Text style={{color:c.muted,fontSize:12,lineHeight:18}}>Sandbox responses are test-only and will remain Pending; they cannot verify a real account.</Text>:null}
        {selectedBank==='Other supported bank'?<><Label>Supported bank name</Label><Field value={otherBankName} onChangeText={setOtherBankName} placeholder="Enter bank name" maxLength={100}/></>:null}
        <Button title="Continue" disabled={!selectedBank} onPress={()=>{setStage('details');setMessage('');}}/>
      </>:null}
      {stage==='details'?<>
        <Text style={{color:c.muted}}>Selected bank: {selectedBank==='Other supported bank'?otherBankName:selectedBank}</Text>
        {pendingAccountId?<>
          <Label>Re-enter account number to retry verification</Label>
          <Field value={accountNumber} onChangeText={value=>setAccountNumber(value.replace(/\D/g,'').slice(0,18))} placeholder="Enter 9–18 digit account number" keyboardType="number-pad" secureTextEntry maxLength={18}/>
        </>:<>
          <Label>Account holder name</Label>
          <Field value={holderName} onChangeText={setHolderName} placeholder="Name on the account" maxLength={100} autoCapitalize="words"/>
          <Label>Bank account number</Label>
          <Field value={accountNumber} onChangeText={value=>setAccountNumber(value.replace(/\D/g,'').slice(0,18))} placeholder="Enter 9–18 digit account number" keyboardType="number-pad" secureTextEntry maxLength={18}/>
          <Label>Confirm bank account number</Label>
          <Field value={confirmAccountNumber} onChangeText={value=>setConfirmAccountNumber(value.replace(/\D/g,'').slice(0,18))} placeholder="Re-enter account number" keyboardType="number-pad" secureTextEntry maxLength={18}/>
        </>}
        <Label>IFSC (required by Cashfree)</Label>
        <Field value={ifsc} onChangeText={value=>setIfsc(value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,11))} placeholder="11-character IFSC" autoCapitalize="characters" maxLength={11}/>
        <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>Cashfree Secure ID requires IFSC for this API. It is sent with the account details over HTTPS and is not stored. Account holder names are encrypted at rest; the full account number is not stored.</Text>
        {!bankVerificationReady?<Text style={{color:c.red,fontSize:12,lineHeight:18}}>{integrationStatus?.bankVerification?.detail||'Bank verification is not configured. Add the Cashfree Secure ID credentials, select an environment, and configure the bank-data encryption key on the backend.'}</Text>:null}
        <Button title={busy?'Verifying...':pendingAccountId?'Retry verification':'Link and verify account'} disabled={busy||!bankVerificationReady} onPress={()=>pendingAccountId?verifyPending({id:pendingAccountId}):createAccount()}/>
        {pendingAccountId?<Text style={{color:c.muted,textAlign:'center'}}>Verification status: PENDING</Text>:null}
      </>:null}
      {message?<Text style={{color:messageTone==='error'?c.red:messageTone==='success'?c.green:c.muted,fontSize:13,textAlign:'center'}}>{message}</Text>:null}
      <TouchableOpacity onPress={cancelLink} accessibilityRole="button">
        <Text style={{textAlign:'center',color:c.muted,fontWeight:'700'}}>Cancel</Text>
      </TouchableOpacity>
    </Card>:message?<Text style={{color:messageTone==='error'?c.red:messageTone==='success'?c.green:c.muted,fontSize:13,textAlign:'center'}}>{message}</Text>:null}
    {stage==='idle'?<Button title="Link Bank Account" icon="add-circle-outline" disabled={busy} onPress={beginLink}/>:null}
  </Page>;
}

export function Offline({navigation}) {
  return <Page background={c.navy}>
    <StatusBar style="light"/>
    <Header title="Offline payments" back onBack={()=>navigation.goBack()}/>
    <View style={{alignItems:'center',gap:16,paddingTop:44}}><View style={{width:86,height:86,borderRadius:28,backgroundColor:'#142E4C',alignItems:'center',justifyContent:'center'}}><Ionicons name="cloud-offline-outline" size={40} color={c.cyan}/></View><Text style={{color:c.white,fontWeight:'900',fontSize:22,textAlign:'center'}}>Offline mode is not active</Text><Text style={{color:'#B4C7DA',fontSize:14,lineHeight:22,textAlign:'center'}}>This app build does not have peer-to-peer Bluetooth payment support. No transfer is queued or sent offline.</Text></View>
    <View style={{marginTop:'auto',paddingTop:36}}><Button title="Back to home" onPress={()=>navigation.navigate('Main',{screen:'Home'})}/></View>
  </Page>;
}

export function Broadcast({navigation}) { return <UnavailableScreen navigation={navigation} title="Mesh broadcast" icon="bluetooth-outline" message="Bluetooth mesh transmission is not enabled. No payment packet was sent."/>; }
export function Upload({navigation}) { return <UnavailableScreen navigation={navigation} title="Upload status" icon="cloud-upload-outline" message="No offline payment packet is queued for upload."/>; }
export function Success({navigation}) { return <UnavailableScreen navigation={navigation} title="Payment status" icon="alert-circle-outline" message="No payment completion was confirmed. No settled payment is shown."/>; }

function UnavailableScreen({navigation,title,icon,message}) {
  return <Page><Header title={title} back onBack={()=>navigation.goBack()}/><EmptyState icon={icon} title="Feature not available" message={message}/><Button title="Return home" variant="secondary" onPress={()=>navigation.navigate('Main',{screen:'Home'})}/></Page>;
}
