import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as c } from '../theme/colors';

// Render only devices supplied by a live service; never invent mesh nodes here.
export default function NetworkDiagram({ devices = [] }) {
  if (!devices.length) {
    return <View style={s.empty}><Ionicons name="git-network-outline" size={30} color={c.muted}/><Text style={s.caption}>No connected devices</Text></View>;
  }
  return <View style={s.wrap}><View style={s.row}>{devices.map((device,index)=><React.Fragment key={device.id}>
    <View style={s.node}><View style={[s.icon,device.connected&&s.connected]}><Ionicons name={device.type==='server'?'server-outline':'phone-portrait-outline'} size={17} color={c.text}/></View><Text style={s.name}>{device.name}</Text></View>
    {index<devices.length-1&&<View style={s.link}/>}
  </React.Fragment>)}</View></View>;
}

const s=StyleSheet.create({wrap:{paddingVertical:22},empty:{minHeight:112,alignItems:'center',justifyContent:'center',gap:10},row:{flexDirection:'row',alignItems:'center',justifyContent:'center'},node:{alignItems:'center',minWidth:54},icon:{height:36,width:36,borderRadius:13,backgroundColor:c.surface2,borderColor:c.line,borderWidth:1,alignItems:'center',justifyContent:'center'},connected:{backgroundColor:c.blue,borderColor:c.cyan},name:{fontSize:10,color:c.muted,marginTop:6},link:{height:2,width:16,backgroundColor:c.line,marginTop:-16},caption:{color:c.muted,fontSize:13,textAlign:'center'}});
