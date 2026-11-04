import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as c } from '../theme/colors';

// Render only devices supplied by a live service; never invent mesh nodes here.
export default function NetworkDiagram({ devices = [] }) {
  if (!devices.length) {
    return <View style={s.empty}><Ionicons name="git-network-outline" size={30} color={c.muted}/><Text style={[s.caption,{color:c.muted}]}>No connected devices</Text></View>;
  }
  return <View style={s.wrap}><View style={s.row}>{devices.map((device,index)=><React.Fragment key={device.id}>
    <View style={s.node}><View style={[s.icon,{backgroundColor:device.connected?c.blue:c.surface2,borderColor:device.connected?c.cyan:c.line}]}><Ionicons name={device.type==='server'?'server-outline':'phone-portrait-outline'} size={17} color={c.text}/></View><Text style={[s.name,{color:c.muted}]}>{device.name}</Text></View>
    {index<devices.length-1&&<View style={[s.link,{backgroundColor:c.line}]}/>}
  </React.Fragment>)}</View></View>;
}

const s=StyleSheet.create({wrap:{paddingVertical:22},empty:{minHeight:112,alignItems:'center',justifyContent:'center',gap:10},row:{flexDirection:'row',alignItems:'center',justifyContent:'center'},node:{alignItems:'center',minWidth:54},icon:{height:36,width:36,borderRadius:13,borderWidth:1,alignItems:'center',justifyContent:'center'},name:{fontSize:10,marginTop:6},link:{height:2,width:16,marginTop:-16},caption:{fontSize:13,textAlign:'center'}});
