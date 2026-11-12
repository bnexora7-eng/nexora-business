import { Text } from "react-native";
import { Heading, Panel, Screen } from "../../src/components";
import { theme } from "../../src/theme";
export default function AccountScreen() {
  return <Screen><Heading subtitle="Ustawienia, dostęp i przyszłe subskrypcje.">Konto</Heading>
    <Panel><Text style={{color:theme.text,fontSize:18,fontWeight:"800"}}>Konto użytkownika</Text>
      <Text style={{color:theme.muted,lineHeight:21}}>Rejestracja, logowanie, profil, prywatność i usuwanie konta zostaną podłączone po przygotowaniu bezpiecznego backendu.</Text></Panel>
    <Panel><Text style={{color:theme.accent,fontWeight:"800"}}>NEXORA PREMIUM</Text><Text style={{color:theme.text,fontSize:18,fontWeight:"800"}}>Płatne funkcje — w przygotowaniu</Text>
      <Text style={{color:theme.muted,lineHeight:21}}>Tutaj pojawią się plan, status subskrypcji, zarządzanie odnowieniem i historią płatności. Żadna płatność nie jest obecnie pobierana.</Text></Panel>
    <Text style={{color:theme.muted,fontSize:12}}>Wersja demonstracyjna 0.1.0</Text>
  </Screen>;
}