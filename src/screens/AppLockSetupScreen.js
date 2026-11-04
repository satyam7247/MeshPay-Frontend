import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as c } from '../theme/colors';
import { Page, Header, Button, Card, Field, Label } from '../components/UI';
import { useApp } from '../context/AppContext';
import { appLockService } from '../services/appLockService';

const matchesType=(value,type)=>type==='numeric'?/^\d{6}$/.test(value):/^[A-Za-z]{6}$/.test(value);

export function AppLockSetupScreen({navigation,route}) {
  const {user,appLock,updateAppLockState,lockAppNow}=useApp();
  const mode=route?.params?.mode==='disable'?'disable':'enable';
  const [stage,setStage]=useState(mode==='disable'?'disable':'type');
  const [type,setType]=useState('');
  const [password,setPassword]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [currentPassword,setCurrentPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    if(mode!=='disable'||!user?.id)return;
    let active=true;
    appLockService.status(user.id).then(status=>{
      if(!active)return;
      updateAppLockState(status,{locked:false});
      if(!status.enabled){
        navigation.goBack();
      }
    }).catch(e=>{
      if(active)setError(e.message||'Could not check App Lock status.');
    });
    return()=>{active=false;};
  },[mode,user?.id,navigation,updateAppLockState]);

  const submitPassword=async()=>{
    setError('');
    if(!matchesType(password,type))return setError(type==='numeric'?'Enter exactly six digits.':'Enter exactly six English letters (A–Z).');
    setStage('confirm');
  };
  const confirmPassword=async(value=confirmation)=>{
    setError('');
    if(value!==password){
      setConfirmation('');
      return setError('Passwords do not match. Enter the same six characters again.');
    }
    setBusy(true);
    try {
      const result=await appLockService.enable(type,password,user.id);
      updateAppLockState(result,{locked:false});
      setPassword('');setConfirmation('');setStage('success');
    } catch(e) {setError(e.message||'App Lock could not be enabled.');}
    finally {setBusy(false);}
  };
  const disable=async(value=currentPassword)=>{
    setError('');
    if(!value)return setError('Enter your screen lock password.');
    setBusy(true);
    try {
      await appLockService.disable(value,user.id);
      updateAppLockState({enabled:false,type:null},{locked:false});
      navigation.goBack();
    } catch(e) {
      if(e?.status===404){
        try {
          const status=await appLockService.status(user.id);
          if(!status.enabled){
            updateAppLockState(status,{locked:false});
            navigation.goBack();
            return;
          }
        } catch {}
      }
      setError(e.message||'App Lock could not be disabled.');
    }
    finally {setBusy(false);setCurrentPassword('');}
  };
  const changeCurrentPassword=value=>{
    const next=appLock.type==='numeric'?value.replace(/\D/g,'').slice(0,6):value.replace(/[^A-Za-z]/g,'').slice(0,6);
    setCurrentPassword(next);
    setError('');
    if(next.length===6&&!busy)void disable(next);
  };
  const continueAfterEnable=()=>{
    lockAppNow();
  };
  const onChange=value=>{
    const next=type==='numeric'?value.replace(/\D/g,'').slice(0,6):value.replace(/[^A-Za-z]/g,'').slice(0,6);
    setPassword(next);
    if(next.length===6){setConfirmation('');setError('');setStage('confirm');}
  };
  const onConfirmationChange=value=>{
    const next=type==='numeric'?value.replace(/\D/g,'').slice(0,6):value.replace(/[^A-Za-z]/g,'').slice(0,6);
    setConfirmation(next);
    if(next.length===6&&!busy)void confirmPassword(next);
  };
  const activeValue=stage==='confirm'?confirmation:password;

  return <Page>
    <Header title={mode==='disable'?'Turn off App Lock':'Set up App Lock'} back onBack={()=>navigation.goBack()}/>
    <View style={{gap:7}}>
      <Text style={{fontSize:25,fontWeight:'900',color:c.text}}>{stage==='type'?'Choose a password type':stage==='create'?'Create Your Screen Lock':stage==='confirm'?'Confirm Your Screen Lock':stage==='success'?'App Lock is ready':'Verify your screen lock'}</Text>
      <Text style={{fontSize:13,color:c.muted,lineHeight:20}}>{stage==='type'?'Choose one six-character format. You can change it later by resetting your screen lock.':stage==='success'?'App Lock Enabled Successfully! Your app will lock whenever it moves to the background.':mode==='disable'?'Enter your existing screen lock password before turning App Lock off.':'Your screen lock password is separate from your MeshPay account password.'}</Text>
    </View>
    {stage==='type'?<View style={{gap:12}}>
      {[{id:'numeric',icon:'keypad-outline',title:'Numeric Password',subtitle:'Exactly 6 digits · 0–9'},{id:'alphabetic',icon:'text-outline',title:'Alphabetic Password',subtitle:'Exactly 6 English letters · A–Z'}].map(option=><TouchableOpacity key={option.id} onPress={()=>{setType(option.id);setPassword('');setStage('create');setError('');}} accessibilityRole="button" style={{backgroundColor:c.surface,borderWidth:1,borderColor:c.line,borderRadius:18,padding:17,flexDirection:'row',alignItems:'center',gap:13}}><Ionicons name={option.icon} size={22} color={c.blue}/><View style={{flex:1,gap:4}}><Text style={{color:c.text,fontWeight:'800',fontSize:15}}>{option.title}</Text><Text style={{color:c.muted,fontSize:12}}>{option.subtitle}</Text></View><Ionicons name="chevron-forward" size={18} color={c.muted}/></TouchableOpacity>)}
    </View>:null}
    {stage==='create'||stage==='confirm'?<Card style={{gap:13}}>
      <View><Label>{stage==='create'?'Create a 6-character password':'Confirm your 6-character password'}</Label><Field value={activeValue} onChangeText={stage==='create'?onChange:onConfirmationChange} placeholder={type==='numeric'?'••••••':'A b C d E f'} secureTextEntry keyboardType={type==='numeric'?'number-pad':'default'} autoCapitalize="none" autoCorrect={false} maxLength={6} returnKeyType="done"/></View>
      <View style={{flexDirection:'row',justifyContent:'center',gap:9}}>{Array.from({length:6},(_,index)=><View key={index} style={{width:13,height:13,borderRadius:7,backgroundColor:index<activeValue.length?c.blue:c.surface2,borderWidth:1,borderColor:c.line}}/>)}</View>
      <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>{stage==='create'?'Enter six characters. The confirmation step will open automatically.':busy?'Saving your App Lock…':'Enter the same six characters again. App Lock saves automatically when they match.'}</Text>
      {stage==='create'?<Button title="Continue" icon="arrow-forward" disabled={busy||activeValue.length!==6} onPress={submitPassword}/>:null}
    </Card>:null}
    {stage==='disable'?<Card style={{gap:13}}>
      <View><Label>Current screen lock password</Label><Field value={currentPassword} onChangeText={changeCurrentPassword} placeholder="Enter your screen lock password" secureTextEntry keyboardType={appLock.type==='numeric'?'number-pad':'default'} autoCapitalize="none" autoCorrect={false} maxLength={6}/></View>
      <Text style={{color:c.muted,fontSize:12,lineHeight:18}}>{busy?'Verifying password and turning App Lock off…':'Enter your six-character App Lock password. It will turn off automatically when verified.'}</Text>
      <Button title={busy?'Verifying…':'Verify and turn off'} icon="lock-open-outline" disabled={busy||currentPassword.length!==6} onPress={()=>disable()}/>
    </Card>:null}
    {stage==='success'?<Card style={{gap:14,alignItems:'center'}}><Ionicons name="checkmark-circle" size={46} color={c.green}/><Text style={{color:c.green,fontWeight:'900',fontSize:17,textAlign:'center'}}>App Lock Enabled Successfully!</Text><Button title="Lock MeshPay now" icon="lock-closed-outline" onPress={continueAfterEnable}/></Card>:null}
    {error?<Card style={{padding:13,borderColor:c.red,backgroundColor:c.dangerSurface}}><Text style={{color:c.red,lineHeight:20}}>{error}</Text></Card>:null}
  </Page>;
}
