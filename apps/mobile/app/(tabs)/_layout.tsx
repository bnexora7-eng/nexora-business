import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";

export default function TabLayout() {
  return <Tabs screenOptions={{
    headerShown:false,tabBarActiveTintColor:theme.accent,tabBarInactiveTintColor:theme.muted,
    tabBarStyle:{backgroundColor:theme.surface,borderTopColor:theme.border,height:66,paddingTop:7,paddingBottom:8},
    tabBarLabelStyle:{fontSize:10,fontWeight:"700"}
  }}>
    <Tabs.Screen name="index" options={{title:"Start",tabBarLabel:"Start",tabBarIcon:({color,size})=><Ionicons name="home-outline" color={color} size={size}/>}}/>
    <Tabs.Screen name="community" options={{title:"Community",tabBarLabel:"Community",tabBarIcon:({color,size})=><Ionicons name="people-outline" color={color} size={size}/>}}/>
    <Tabs.Screen name="marketplace" options={{title:"Rynek",tabBarLabel:"Rynek",tabBarIcon:({color,size})=><Ionicons name="storefront-outline" color={color} size={size}/>}}/>
    <Tabs.Screen name="business" options={{title:"Business",tabBarLabel:"Business",tabBarIcon:({color,size})=><Ionicons name="briefcase-outline" color={color} size={size}/>}}/>
    <Tabs.Screen name="account" options={{title:"Konto",tabBarLabel:"Konto",tabBarIcon:({color,size})=><Ionicons name="person-circle-outline" color={color} size={size}/>}}/>
  </Tabs>;
}