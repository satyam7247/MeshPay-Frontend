import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors as c } from '../theme/colors';
import { useApp } from '../context/AppContext';

export const Page=({children,scroll=true,background=c.bg,contentStyle,refreshControl})=>scroll
  ? <ScrollView style={{flex:1,backgroundColor:background}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} refreshControl={refreshControl} contentContainerStyle={[s.page,contentStyle]}>{children}</ScrollView>
  : <View style={[s.page,{flex:1,backgroundColor:background},contentStyle]}>{children}</View>;

function NotificationBell() {
  const navigation=useNavigation();
  const {user,unreadNotificationCount}=useApp();
  const scale=useRef(new Animated.Value(1)).current;
  const previousCount=useRef(unreadNotificationCount);
  useEffect(()=>{
    if(unreadNotificationCount>previousCount.current) {
      Animated.sequence([
        Animated.timing(scale,{toValue:1.2,duration:120,useNativeDriver:true}),
        Animated.spring(scale,{toValue:1,useNativeDriver:true,friction:4}),
      ]).start();
    }
    previousCount.current=unreadNotificationCount;
  },[unreadNotificationCount,scale]);
  if(!user)return null;
  const label=unreadNotificationCount?`Notifications, ${unreadNotificationCount} unread`:'Notifications';
  return <Animated.View style={{transform:[{scale}]}}>
    <TouchableOpacity onPress={()=>navigation.navigate('Notifications')} accessibilityRole="button" accessibilityLabel={label} hitSlop={7} style={s.notificationBell}>
      <Ionicons name="notifications-outline" size={22} color={c.text}/>
      {unreadNotificationCount>0?<View style={s.notificationBadge}><Text style={s.notificationBadgeText}>{unreadNotificationCount>99?'99+':unreadNotificationCount}</Text></View>:null}
    </TouchableOpacity>
  </Animated.View>;
}

export function Header({title,back,onBack,right}) {
  return <View style={s.header}>
    {back?<TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" style={s.back}><Ionicons name="arrow-back" size={22} color={c.text}/></TouchableOpacity>:null}
    <Text style={s.title}>{title}</Text><View style={s.headerActions}><NotificationBell/>{right||null}{!right&&!title?<View style={{width:8}}/>:null}</View>
  </View>;
}

export function Button({title,onPress,variant='primary',icon,disabled,style}) {
  const color=variant==='danger'?c.red:variant==='green'?c.green:variant==='secondary'?c.surface2:variant==='outline'?c.surface:c.navy;
  const ink=variant==='outline'?c.blue:variant==='secondary'?c.text:c.white;
  return <TouchableOpacity disabled={disabled} activeOpacity={.82} onPress={onPress} style={[s.button,{backgroundColor:color,borderWidth:variant==='outline'||variant==='secondary'?1:0,borderColor:variant==='outline'?c.blue:c.line},style,disabled&&{opacity:.5}]}>
    {icon?<Ionicons name={icon} size={18} color={ink}/>:null}<Text style={[s.buttonText,{color:ink}]}>{title}</Text>
  </TouchableOpacity>;
}

export function Card({children,style}) { return <View style={[s.card,style]}>{children}</View>; }
export function Label({children}) { return <Text style={s.label}>{children}</Text>; }

export function Avatar({name,size=46,color=c.blue}) {
  const initial=String(name||'').trim().slice(0,1).toUpperCase();
  return <View style={[s.avatar,{width:size,height:size,borderRadius:size/2,backgroundColor:color}]}>{initial?<Text style={{color:c.white,fontSize:size*.42,fontWeight:'800'}}>{initial}</Text>:<Ionicons name="person" size={size*.46} color={c.white}/>}</View>;
}

export function Field({style,...props}) { return <TextInput placeholderTextColor={c.muted} selectionColor={c.blue} style={[s.field,style]} {...props}/>; }

export function Badge({children,tone='blue'}) {
  const color=tone==='green'?c.green:tone==='amber'?'#A36A13':tone==='red'?c.red:c.blue;
  const bg=tone==='amber'?'#FFF5DF':tone==='red'?'#FFF0F1':tone==='green'?'#E9F8F1':'#EAF2FF';
  return <View style={[s.badge,{backgroundColor:bg}]}><Text style={{fontSize:11,color,fontWeight:'800'}}>{children}</Text></View>;
}

export function SectionTitle({title,action,onAction}) {
  return <View style={s.sectionHead}><Text style={s.section}>{title}</Text>{action?<TouchableOpacity onPress={onAction}><Text style={{color:c.blue,fontWeight:'800',fontSize:12}}>{action}</Text></TouchableOpacity>:null}</View>;
}

const s=StyleSheet.create({
  page:{paddingHorizontal:20,paddingTop:16,paddingBottom:32,gap:18},
  header:{height:48,flexDirection:'row',alignItems:'center',gap:10,marginBottom:2},
  headerActions:{flexDirection:'row',alignItems:'center',gap:8},
  notificationBell:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center'},
  notificationBadge:{position:'absolute',top:0,right:-1,minWidth:18,height:18,borderRadius:9,backgroundColor:'#D9364F',alignItems:'center',justifyContent:'center',paddingHorizontal:4,borderWidth:1,borderColor:c.surface},
  notificationBadgeText:{color:'#FFFFFF',fontSize:10,fontWeight:'900'},
  back:{width:34,height:38,alignItems:'flex-start',justifyContent:'center'},
  title:{fontSize:19,fontWeight:'900',color:c.text,flex:1},
  card:{padding:16,borderRadius:19,backgroundColor:c.surface,borderWidth:1,borderColor:c.line},
  button:{minHeight:54,paddingHorizontal:18,borderRadius:15,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9},
  buttonText:{fontSize:15,fontWeight:'800'},
  label:{fontSize:12,color:c.muted,fontWeight:'800',marginBottom:8},
  avatar:{alignItems:'center',justifyContent:'center'},
  field:{minHeight:52,borderRadius:13,backgroundColor:c.surface,borderColor:c.line,borderWidth:1,paddingHorizontal:14,color:c.text,fontSize:15},
  badge:{paddingVertical:6,paddingHorizontal:10,borderRadius:20,alignSelf:'flex-start'},
  sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:2},
  section:{fontSize:17,fontWeight:'900',color:c.text},
});
