import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { Heading, Panel, Screen } from "../../src/components";
import { theme } from "../../src/theme";
export default function ModuleScreen() {
  const {slug}=useLocalSearchParams<{slug:string}>();
  const payment=slug==="payment-integrity";
  return <Screen><Heading subtitle={payment?"Moduł bezpieczeństwa zdarzeń płatniczych.":"Moduł platformy NEXORA."}>{payment?"Payment Integrity":"Moduł NEXORA"}</Heading>
    <Panel><Text style={{color:theme.accent,fontWeight:"800"}}>DEMO / NIE JEST PRODUKCYJNY</Text><Text style={{color:theme.text,fontSize:18,fontWeight:"800"}}>{payment?"Walidacja zdarzeń płatniczych":String(slug)}</Text>
      <Text style={{color:theme.muted,lineHeight:21}}>{payment?"Istniejący demonstrator pokazuje decyzje ACCEPT / REVIEW / REJECT / DUPLICATE na danych testowych. Ta aplikacja nie łączy się jeszcze z bankiem, operatorem płatności ani backendem i nie przetwarza prawdziwych płatności.":"Ten moduł jest częścią wspólnej platformy."}</Text></Panel>
    <View style={{gap:8}}><Text style={{color:theme.text,fontWeight:"700"}}>Kolejny etap</Text><Text style={{color:theme.muted}}>• Integracja z backendem i autoryzacją</Text><Text style={{color:theme.muted}}>• Testy bezpieczeństwa i audyt</Text><Text style={{color:theme.muted}}>• Dopiero potem wdrożenie produkcyjne</Text></View>
  </Screen>;
}