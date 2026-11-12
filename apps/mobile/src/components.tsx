import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "./theme";

export function Screen({children}:{children:ReactNode}) {
  return <View style={s.screen}>{children}</View>;
}
export function Eyebrow({children}:{children:ReactNode}) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
export function Heading({children,subtitle}:{children:ReactNode;subtitle?:string}) {
  return <View style={{gap:6}}><Text style={s.heading}>{children}</Text>{subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}</View>;
}
export function Panel({children}:{children:ReactNode}) {
  return <View style={s.panel}>{children}</View>;
}
export function ActionCard({title,description,icon,onPress,tag}:{title:string;description:string;icon:string;onPress:()=>void;tag?:string}) {
  return <Pressable onPress={onPress} style={({pressed})=>[s.card,pressed&&{opacity:0.78}]}>
    <View style={s.cardTop}><Text style={s.cardIcon}>{icon}</Text>{tag?<Text style={s.tag}>{tag}</Text>:null}</View>
    <Text style={s.cardTitle}>{title}</Text><Text style={s.cardDescription}>{description}</Text><Text style={s.open}>Otwórz moduł →</Text>
  </Pressable>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:theme.background,paddingHorizontal:20,paddingTop:18,gap:20},
  eyebrow:{color:theme.accent,fontSize:11,fontWeight:"800",letterSpacing:2},
  heading:{color:theme.text,fontSize:27,fontWeight:"800",letterSpacing:-0.6},
  subtitle:{color:theme.muted,fontSize:14,lineHeight:21},
  panel:{backgroundColor:theme.surface,borderColor:theme.border,borderWidth:1,borderRadius:18,padding:17,gap:9},
  card:{backgroundColor:theme.surface,borderColor:theme.border,borderWidth:1,borderRadius:18,padding:16,gap:8,minHeight:154},
  cardTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  cardIcon:{fontSize:25},tag:{color:theme.accent,backgroundColor:theme.accentDark,borderRadius:20,paddingHorizontal:9,paddingVertical:4,fontSize:10,fontWeight:"800"},
  cardTitle:{color:theme.text,fontSize:17,fontWeight:"800"},cardDescription:{color:theme.muted,fontSize:12,lineHeight:18},
  open:{color:theme.accent,fontSize:12,fontWeight:"700",marginTop:3}
});