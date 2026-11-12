import { Text, View } from "react-native";
import { Heading, Panel, Screen } from "../../src/components";
import { theme } from "../../src/theme";
export default function BusinessScreen() {
  return <Screen><Heading subtitle="Cyfrowe narzędzia i płatne pakiety dla firm.">Business Tools</Heading>
    <Panel><Text style={{color:theme.accent,fontWeight:"800"}}>MODEL KOMERCYJNY</Text><Text style={{color:theme.text,fontSize:18,fontWeight:"800"}}>NEXORA Business</Text>
      <Text style={{color:theme.muted,lineHeight:21}}>Docelowo firmy będą mogły kupować plany z dodatkowymi narzędziami, widocznością ofert i funkcjami analitycznymi. Cennik i konkretne świadczenia ustalimy przed uruchomieniem sprzedaży.</Text></Panel>
    <View style={{gap:8}}><Text style={{color:theme.text,fontWeight:"700"}}>Planowane elementy</Text>{["Profil i panel firmy","Zarządzanie ofertami","Statystyki i analityka","Pakiety Business"].map(x=><Text key={x} style={{color:theme.muted}}>• {x}</Text>)}</View>
  </Screen>;
}