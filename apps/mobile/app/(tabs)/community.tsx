import { Text, View } from "react-native";
import { Heading, Panel, Screen } from "../../src/components";
import { theme } from "../../src/theme";
export default function CommunityScreen() {
  return <Screen><Heading subtitle="Poznawaj ludzi i buduj wartościowe relacje.">Community</Heading>
    <Panel><Text style={{color:theme.accent,fontWeight:"800"}}>W PRZYGOTOWANIU</Text><Text style={{color:theme.text,fontSize:18,fontWeight:"800"}}>Profile i społeczność</Text>
      <Text style={{color:theme.muted,lineHeight:21}}>Docelowo: profile użytkowników, obserwowanie, publikacje, wyszukiwanie i zgłaszanie treści. Publiczne funkcje społecznościowe ruszą dopiero z moderacją i narzędziami bezpieczeństwa.</Text></Panel>
    <View style={{gap:8}}><Text style={{color:theme.text,fontWeight:"700"}}>Planowane funkcje</Text>{["Profil użytkownika","Odkrywanie i wyszukiwanie","Posty i interakcje","Zgłoszenia i moderacja"].map(x=><Text key={x} style={{color:theme.muted}}>• {x}</Text>)}</View>
  </Screen>;
}