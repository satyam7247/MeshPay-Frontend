import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors as c } from '../theme/colors';
import { Page, Button, Card, Field, Label } from '../components/UI';
import { useApp } from '../context/AppContext';
import { appLockService } from '../services/appLockService';

const digitsOnly=value=>value.replace(/\D/g,'').slice(0,6);
const lettersOnly=value=>value.replace(/[^A-Za-z]/g,'').slice(0,6);

export function AppLockScreen() {
  const {user,appLock,appLockLoading,initializeAppLock,unlockAppLock,updateAppLockState,resolvedTheme}=useApp();
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [stage,setStage]=useState('lock');
  const [challengeId,setChallengeId]=useState('');
  const [code,setCode]=useState('');
  const [resetToken,setResetToken]=useState('');
  const [seconds,setSeconds]=useState(0);
  const [newType,setNewType]=useState(appLock.type||'numeric');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');

  useEffect(()=>{
    if(seconds<=0)return undefined;
    const timer=setTimeout(()=>setSeconds(value=>Math.max(0,value-1)),1000);
    return()=>clearTimeout(timer);
  },[seconds]);

  const submitUnlock=async(value=password)=>{
    setError('');
    if(value.length!==6)return setError('Enter your six-character screen lock password.');
    setBusy(true);
    try {await unlockAppLock(value);setPassword('');}
    catch(e) {setPassword('');setError(e.status===400?'Incorrect Password. Please Try Again.':e.message||'Could not verify your screen lock.');}
    finally {setBusy(false);}
  };
  const handleUnlockInput=value=>{
    const next=appLock.type==='numeric'?digitsOnly(value):lettersOnly(value);
    setPassword(next);
    setError('');
    if(next.length===6&&!busy)void submitUnlock(next);
  };

  const requestOtp=async()=>{
    setBusy(true);setError('');
    try {
      const result=await appLockService.requestResetOtp();
      setChallengeId(result.challengeId);setSeconds(result.resendAfterSeconds||60);setCode('');setStage('otp');
    } catch(e) {setError(e.message||'Could not send the verification code.');}
    finally {setBusy(false);}
  };
  const verifyOtp=async()=>{
    if(!/^\d{6}$/.test(code))return setError('Enter the six-digit verification code.');
    setBusy(true);setError('');
    try {const result=await appLockService.verifyResetOtp(challengeId,code);setResetToken(result.resetToken);setNewType(appLock.type||'numeric');setStage('new');}
    catch(e) {setError(e.message||'The verification code could not be verified.');}
    finally {setBusy(false);}
  };
  const resetPassword=async()=>{
    const valid=newType==='numeric'?/^\d{6}$/.test(newPassword):/^[A-Za-z]{6}$/.test(newPassword);
    if(!valid)return setError(newType==='numeric'?'Enter exactly six digits.':'Enter exactly six English letters (A–Z).');
    if(newPassword!==confirmPassword)return setError('Passwords do not match. Please try again.');
    setBusy(true);setError('');
    try {
      const result=await appLockService.reset(challengeId,resetToken,newType,newPassword,user.id);
      updateAppLockState(result,{locked:true});
      setPassword('');setNewPassword('');setConfirmPassword('');setStage('reset-success');
    } catch(e) {setError(e.message||'The screen lock password could not be reset.');}
    finally {setBusy(false);}
  };

  const retryStatus=async()=>{
    setBusy(true);setError('');
    try {await initializeAppLock(user.id);}
    catch(e) {setError(e.message||'Connect to the internet to check App Lock.');}
    finally {setBusy(false);}
  };
  const setNewValue=value=>setNewPassword(newType==='numeric'?digitsOnly(value):lettersOnly(value));
  const maskEmail=value=>{
    const [name,domain]=String(value||'').split('@');
    return name&&domain?`${name.slice(0,1)}${'•'.repeat(Math.min(5,Math.max(2,name.length-1)))}@${domain}`:'your registered email';
  };

  return <Page scroll={false} background={c.bg} contentStyle={{paddingHorizontal:24,paddingTop:36,paddingBottom:28,justifyContent:'center'}}>
    <StatusBar style={resolvedTheme==='dark'||resolvedTheme==='lavender'?'light':'dark'}/>
    <View style={{alignItems:'center',gap:9,marginBottom:26}}>
      <View style={{width:66,height:66,borderRadius:23,backgroundColor:c.surface2,borderWidth:1,borderColor:c.line,alignItems:'center',justifyContent:'center'}}><Ionicons name="git-network-outline" size={34} color={c.cyan}/></View>
      <Text style={{fontSize:26,fontWeight:'900',letterSpacing:-.7,color:c.text}}>Mesh<Text style={{color:c.cyan}}>Pay</Text></Text>
    </View>
    {stage==='lock'?<View style={{gap:17}}>
      <View style={{alignItems:'center',gap:7}}><Text style={{fontSize:25,fontWeight:'900',color:c.text}}>App Locked</Text><Text style={{color:c.muted,fontSize:14,textAlign:'center',lineHeight:20}}>Enter your screen lock password to continue.</Text></View>
      {appLock.type? <Card style={{gap:16}}>
        <View style={{alignItems:'center',gap:9}}>
          <TouchableOpacity activeOpacity={1} onPress={()=>{}} accessibilityLabel="Six character screen lock password">
            <View style={{flexDirection:'row',gap:12,paddingVertical:8}}>{Array.from({length:6},(_,index)=><View key={index} style={{width:17,height:17,borderRadius:9,borderWidth:1.5,borderColor:index<password.length?c.cyan:c.line,backgroundColor:index<password.length?c.cyan:'transparent'}}/>)}</View>
          </TouchableOpacity>
          <Field value={password} onChangeText={handleUnlockInput} placeholder={appLock.type==='numeric'?'6-digit numeric password':'6-letter password'} secureTextEntry keyboardType={appLock.type==='numeric'?'number-pad':'default'} autoCapitalize="none" autoCorrect={false} maxLength={6} returnKeyType="done" onSubmitEditing={()=>submitUnlock()} style={{width:'100%',backgroundColor:c.bg,borderColor:c.line,color:c.text,textAlign:'center',letterSpacing:5}}/>
        </View>
        <Button title={busy?'Checking…':'Unlock'} icon="lock-open-outline" disabled={busy||password.length!==6} onPress={()=>submitUnlock()}/>
      </Card>:<Card style={{alignItems:'center',gap:12}}>{appLockLoading?<ActivityIndicator color={c.cyan}/>:<Text style={{color:c.text,textAlign:'center',lineHeight:20}}>Connect to the internet to check this account’s App Lock status.</Text>}<Button title={busy?'Checking…':'Try again'} disabled={busy} onPress={retryStatus}/></Card>}
      {error?<Text style={{color:c.red,textAlign:'center',lineHeight:19}}>{error}</Text>:null}
      {appLock.type?<TouchableOpacity onPress={()=>{setError('');setStage('confirm-email');}} style={{alignSelf:'center',paddingVertical:8}}><Text style={{color:c.cyan,fontWeight:'800'}}>Forgot Screen Lock?</Text></TouchableOpacity>:null}
    </View>:null}

    {stage==='confirm-email'?<View style={{gap:15}}>
      <Text style={{fontSize:24,fontWeight:'900',color:c.text,textAlign:'center'}}>Reset screen lock</Text>
      <Card style={{gap:13}}>
        <Text style={{color:c.text,fontSize:13,lineHeight:20,textAlign:'center'}}>Confirm that we should send a one-time code to your registered email address.</Text>
        <Text style={{color:c.cyan,fontWeight:'800',textAlign:'center'}}>{maskEmail(user?.email)}</Text>
        <Button title={busy?'Sending…':'Send verification code'} icon="mail-outline" disabled={busy} onPress={requestOtp}/>
        <TouchableOpacity onPress={()=>setStage('lock')} style={{alignSelf:'center',padding:7}}><Text style={{color:c.muted,fontWeight:'700'}}>Cancel</Text></TouchableOpacity>
      </Card>
      {error?<Text style={{color:c.red,textAlign:'center'}}>{error}</Text>:null}
    </View>:null}

    {stage==='otp'?<View style={{gap:15}}>
      <Text style={{fontSize:24,fontWeight:'900',color:c.text,textAlign:'center'}}>Verify your email</Text>
      <Card style={{gap:13}}>
        <Text style={{color:c.text,fontSize:13,lineHeight:20,textAlign:'center'}}>Enter the six-digit code sent to {maskEmail(user?.email)}. It expires in 5 minutes.</Text>
        <View><Label>Verification code</Label><Field value={code} onChangeText={value=>setCode(digitsOnly(value))} placeholder="000000" keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} style={{textAlign:'center',letterSpacing:6,color:c.text,backgroundColor:c.bg,borderColor:c.line}}/></View>
        <Button title={busy?'Verifying…':'Verify code'} icon="shield-checkmark-outline" disabled={busy||code.length!==6} onPress={verifyOtp}/>
        <TouchableOpacity disabled={busy||seconds>0} onPress={requestOtp} style={{alignSelf:'center',padding:7}}><Text style={{color:seconds>0?c.muted:c.cyan,fontWeight:'800'}}>{seconds>0?`Resend code in ${seconds}s`:'Resend verification code'}</Text></TouchableOpacity>
      </Card>
      {error?<Text style={{color:c.red,textAlign:'center'}}>{error}</Text>:null}
    </View>:null}

    {stage==='new'?<View style={{gap:14}}>
      <Text style={{fontSize:24,fontWeight:'900',color:c.text,textAlign:'center'}}>Create a new screen lock</Text>
      <Card style={{gap:13}}>
        <Text style={{color:c.text,fontSize:13,textAlign:'center'}}>Choose a password type, then create and confirm six characters.</Text>
        <View style={{flexDirection:'row',gap:8}}>{[{id:'numeric',title:'Numeric'},{id:'alphabetic',title:'Alphabetic'}].map(option=><TouchableOpacity key={option.id} onPress={()=>{setNewType(option.id);setNewPassword('');setConfirmPassword('');}} style={{flex:1,padding:10,borderRadius:12,borderWidth:1,borderColor:newType===option.id?c.cyan:c.line,alignItems:'center'}}><Text style={{color:newType===option.id?c.cyan:c.text,fontWeight:'800'}}>{option.title}</Text></TouchableOpacity>)}</View>
        <View><Label>New password</Label><Field value={newPassword} onChangeText={setNewValue} placeholder={newType==='numeric'?'Six digits':'Six English letters'} secureTextEntry keyboardType={newType==='numeric'?'number-pad':'default'} autoCapitalize="none" autoCorrect={false} maxLength={6} style={{backgroundColor:c.bg,borderColor:c.line,color:c.text}}/></View>
        <View><Label>Confirm new password</Label><Field value={confirmPassword} onChangeText={value=>setConfirmPassword(newType==='numeric'?digitsOnly(value):lettersOnly(value))} placeholder="Enter it again" secureTextEntry keyboardType={newType==='numeric'?'number-pad':'default'} autoCapitalize="none" autoCorrect={false} maxLength={6} style={{backgroundColor:c.bg,borderColor:c.line,color:c.text}}/></View>
        <Button title={busy?'Saving…':'Reset screen lock'} icon="lock-closed-outline" disabled={busy||newPassword.length!==6||confirmPassword.length!==6} onPress={resetPassword}/>
      </Card>
      {error?<Text style={{color:c.red,textAlign:'center'}}>{error}</Text>:null}
    </View>:null}

    {stage==='reset-success'?<View style={{gap:16}}><Card style={{alignItems:'center',gap:12}}><Ionicons name="checkmark-circle" size={46} color={c.green}/><Text style={{color:c.text,fontSize:18,fontWeight:'900',textAlign:'center'}}>Your Screen Lock Password Has Been Reset Successfully!</Text><Button title="Back to App Lock" onPress={()=>setStage('lock')}/></Card></View>:null}
  </Page>;
}
