import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ActionCard, Eyebrow, Heading, Panel, Screen } from "../../src/components";
import { theme } from "../../src/theme";

export default function HomeScreen() {
  const router=useRouter();
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{gap:20,paddingBottom:28}}>
    <View style={{gap:7}}><Eyebrow>NEXORA PLATFORM</Eyebrow><Heading subtitle="Jedna platforma. Społeczność, handel i narzędzia biznesowe.">Witaj w NEXORA</Heading></View>
    <Panel><Text style={{color:theme.accent,fontSize:11,fontWeight:"800",letterSpacing:1.4}}>TWOJA PLATFORMA</Text>
      <Text style={{color:theme.text,fontSize:20,fontWeight:"800"}}>Odkrywaj. Łącz. Rozwijaj.</Text>
      <Text style={{color:theme.muted,fontSize:13,lineHeight:20}}>NEXORA łączy ludzi, oferty i narzędzia dla firm. To wczesna wersja demonstracyjna — funkcje serwerowe i płatności są w przygotowaniu.</Text>
    </Panel>
    <View style={{gap:12}}><Heading subtitle="Wybierz obszar platformy">Moduły NEXORA</Heading>
      <ActionCard icon="◎" title="Community" description="Społeczność, profile i odkrywanie użytkowników." onPress={()=>router.push("/(tabs)/community")}/>
      <ActionCard icon="◇" title="Marketplace" description="Oferty, usługi i możliwości współpracy." onPress={()=>router.push("/(tabs)/marketplace")}/>
      <ActionCard icon="▦" title="Business Tools" description="Narzędzia i pakiety dla przedsiębiorców." onPress={()=>router.push("/(tabs)/business")}/>
      <ActionCard icon="⛨" title="Payment Integrity" description="Walidacja zdarzeń płatniczych i ochrona procesów." tag="BETA / DEMO" onPress={()=>router.push("/module/payment-integrity")}/>
    </View>
  </ScrollView></Screen>;
}