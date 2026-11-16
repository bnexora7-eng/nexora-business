import { Text, View } from "react-native";
import { Heading, Panel, Screen } from "../../src/components";
import { theme } from "../../src/theme";
export default function MarketplaceScreen() {
  return <Screen><Heading subtitle="Oferty i usługi w jednym miejscu.">Marketplace</Heading>
    <Panel><Text style={{color:theme.accent,fontWeight:"800"}}>KONCEPCJA MODUŁU</Text><Text style={{color:theme.text,fontSize:18,fontWeight:"800"}}>Rynek NEXORA</Text>
      <Text style={{color:theme.muted,lineHeight:21}}>Przygotowujemy katalog ofert, profile sprzedawców, zapytania i bezpieczny proces transakcji. Płatności i wypłaty dodamy po wdrożeniu weryfikacji sprzedawców, zasad zwrotów i rozliczeń.</Text></Panel>
    <View style={{gap:8}}><Text style={{color:theme.text,fontWeight:"700"}}>Planowane funkcje</Text>{["Oferty produktów i usług","Konta sprzedawców","Zamówienia i statusy","Prowizje oraz rozliczenia"].map(x=><Text key={x} style={{color:theme.muted}}>• {x}</Text>)}</View>
  </Screen>;
}