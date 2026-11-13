import React, { useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import NexoraModules from "./NexoraModules";
import { API_BASE } from "./api";
import { Alert, BackHandler, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from "react-native";

type Tab = "Home" | "Community" | "Marketplace" | "Business" | "Integrity" | "Payments" | "Profile";
type Decision = "ACCEPT" | "REVIEW" | "REJECT";
type Account = { id: string; email: string; created_at: string };

const C = { bg:"#08111F", panel:"#111E30", panel2:"#17263B", line:"#263A53", text:"#F3F7FC", muted:"#91A4BA", cyan:"#4DE1D2", blue:"#6EA8FF", green:"#43D19E", amber:"#F5BD58", red:"#FF7777" };

function Pill({label,active,onPress}:{label:string;active?:boolean;onPress:()=>void}) {
  return <TouchableOpacity onPress={onPress} style={[styles.pill,active&&styles.pillActive]}><Text style={[styles.pillText,active&&{color:C.bg}]}>{label}</Text></TouchableOpacity>;
}
function Card({children}:{children:React.ReactNode}) { return <View style={styles.card}>{children}</View>; }
function Action({title,subtitle,onPress}:{title:string;subtitle:string;onPress:()=>void}) {
  return <TouchableOpacity style={styles.action} onPress={onPress}><View style={{flex:1}}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.muted}>{subtitle}</Text></View><Text style={styles.arrow}>›</Text></TouchableOpacity>;
}

export default function App() {
  const [tab,setTab] = useState<Tab>("Home");
  const [amount,setAmount] = useState("950");
  const [reference,setReference] = useState("NX-2026-001");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [authMode,setAuthMode] = useState<"login"|"register">("register");
  const [authBusy,setAuthBusy] = useState(false);
  const [authMessage,setAuthMessage] = useState("");
  const [account,setAccount] = useState<Account|null>(null);
  const [decision,setDecision] = useState<Decision|null>(null);
  const [plan,setPlan] = useState("Free");
  const [paymentAmount,setPaymentAmount] = useState("19.90");
  const [paymentDescription,setPaymentDescription] = useState("NEXORA service");
  const [paymentBusy,setPaymentBusy] = useState(false);
  const [paymentMessage,setPaymentMessage] = useState("");
  const [paymentOrderId,setPaymentOrderId] = useState("");
  const [paymentStatus,setPaymentStatus] = useState("");


  useEffect(() => {
    let active = true;
    (async () => {
      if (!API_BASE) { if (active) setAuthMessage("Serwer konta nie jest jeszcze podłączony."); return; }
      try {
        const token = await SecureStore.getItemAsync("nexora_session");
        if (!token) return;
        const response = await fetch(API_BASE + "/v1/auth/me", { headers: { Authorization: "Bearer " + token } });
        if (!response.ok) { await SecureStore.deleteItemAsync("nexora_session"); return; }
        const data = await response.json();
        if (active) setAccount(data.user);
      } catch {
        if (active) setAuthMessage("Nie można połączyć się z serwerem konta.");
      }
    })();
    return () => { active = false; };
  }, []);

  const submitAuth = async () => {
    setAuthMessage("");
    if (!API_BASE) { setAuthMessage("Logowanie będzie dostępne po podłączeniu serwera NEXORA."); return; }
    if (!email.trim() || !password) { setAuthMessage("Wpisz adres e-mail i hasło."); return; }
    setAuthBusy(true);
    try {
      const response = await fetch(API_BASE + (authMode === "register" ? "/v1/auth/register" : "/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się zalogować.");
      await SecureStore.setItemAsync("nexora_session", data.token);
      setAccount(data.user);
      setPassword("");
      setAuthMessage(authMode === "register" ? "Konto zostało utworzone." : "Zalogowano pomyślnie.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Błąd połączenia.");
    } finally {
      setAuthBusy(false);
    }
  };

  const startPayment = async () => {
    setPaymentMessage("");
    if (!account) { setPaymentMessage("Najpierw zaloguj się na konto NEXORA w zakładce Profil."); return; }
    setPaymentBusy(true);
    try {
      const token = await SecureStore.getItemAsync("nexora_session");
      const response = await fetch(API_BASE + "/v1/payments", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ amount: paymentAmount, description: paymentDescription }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się utworzyć płatności.");
      setPaymentOrderId(data.order_id); setPaymentStatus(data.status);
      await Linking.openURL(data.checkout_url);
      setPaymentMessage(data.mode === "test" ? "Otworzono testową płatność Mollie. Nie są pobierane prawdziwe pieniądze." : "Otworzono stronę płatności. Po powrocie sprawdź status.");
    } catch (error) { setPaymentMessage(error instanceof Error ? error.message : "Błąd połączenia z płatnościami."); }
    finally { setPaymentBusy(false); }
  };

  const refreshPayment = async () => {
    if (!paymentOrderId) return;
    setPaymentBusy(true);
    try {
      const token = await SecureStore.getItemAsync("nexora_session");
      const response = await fetch(API_BASE + "/v1/payments/" + paymentOrderId, { headers: { Authorization: "Bearer " + token } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie można sprawdzić płatności.");
      setPaymentStatus(data.status); setPaymentMessage(data.paid ? "Płatność potwierdzona przez operatora." : "Aktualny status: " + data.status);
    } catch (error) { setPaymentMessage(error instanceof Error ? error.message : "Nie udało się sprawdzić statusu."); }
    finally { setPaymentBusy(false); }
  };
  const signOut = async () => {
    try {
      const token = await SecureStore.getItemAsync("nexora_session");
      if (token && API_BASE) await fetch(API_BASE + "/v1/auth/logout", { method: "POST", headers: { Authorization: "Bearer " + token } });
    } catch {}
    await SecureStore.deleteItemAsync("nexora_session");
    setAccount(null);
    setAuthMessage("Wylogowano.");
  };

  const deleteAccount = () => {
    Alert.alert(
      "Delete NEXORA account?",
      "This permanently deletes your account, posts, marketplace listings and business workspace. Payment records may be retained without your account link where legally required.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: async () => {
          try {
            const token = await SecureStore.getItemAsync("nexora_session");
            const response = await fetch(API_BASE + "/v1/auth/account", { method: "DELETE", headers: { Authorization: "Bearer " + token } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Account deletion failed.");
            await SecureStore.deleteItemAsync("nexora_session");
            setAccount(null); setPassword(""); setAuthMessage("Your NEXORA account and associated content have been deleted.");
            setTab("Home");
          } catch (error) {
            Alert.alert("Account not deleted", error instanceof Error ? error.message : "Please try again.");
          }
        }}
      ]
    );
  };

  const screening = useMemo(():Decision => {
    const n = Number(amount.replace(",","."));
    if (!Number.isFinite(n) || n <= 0) return "REJECT";
    if (n > 5000) return "REVIEW";
    if (reference.trim().length < 5) return "REVIEW";
    return "ACCEPT";
  },[amount,reference]);

  const go = (next:Tab) => { setTab(next); setDecision(null); };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tab !== "Home") { setTab("Home"); setDecision(null); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [tab]);
  const heading:Record<Tab,string> = {
    Home:"One platform. More possibilities.",
    Community:"NEXORA Community",
    Marketplace:"NEXORA Marketplace",
    Business:"Business Tools",
    Integrity:"Payment Integrity",
    Payments:"Pay for NEXORA services",
    Profile:"Your NEXORA account"
  };

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
    <View style={styles.header}>
      <View><Text style={styles.brand}>NEXORA<Text style={{color:C.cyan}}>.</Text></Text><Text style={styles.tag}>BUSINESS ECOSYSTEM</Text></View>
      <View style={styles.status}><View style={styles.dot}/><Text style={styles.statusText}>PROTOTYPE</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>{tab.toUpperCase()}</Text>
      <Text style={styles.heading}>{heading[tab]}</Text>
      {tab==="Home" && <>
        <Card>
          <Text style={styles.kicker}>THE NEXORA VISION</Text>
          <Text style={styles.hero}>A connected digital ecosystem for people and business.</Text>
          <Text style={styles.muted}>Discover services, connect with people, grow a business and bring more confidence to digital payments.</Text>
          <View style={styles.tagRow}><Text style={styles.tagChip}>COMMUNITY</Text><Text style={styles.tagChip}>COMMERCE</Text><Text style={styles.tagChip}>TRUST</Text></View>
        </Card>
        <Text style={styles.section}>Explore the platform</Text>
        <Action title="Community" subtitle="Connect, share and discover" onPress={()=>go("Community")}/>
        <Action title="Marketplace" subtitle="Products, services and offers" onPress={()=>go("Marketplace")}/>
        <Action title="Business Tools" subtitle="Tools for growing businesses" onPress={()=>go("Business")}/>
        <Action title="Payment Integrity" subtitle="A decision-support payment screening module" onPress={()=>go("Integrity")}/>
      </>}
      {(tab==="Community"||tab==="Marketplace"||tab==="Business")&&<NexoraModules screen={tab} signedIn={!!account} onNavigate={go}/>}
      {tab==="Integrity" && <>
        <Card><Text style={styles.kicker}>PAYMENT INTEGRITY • DEMO</Text><Text style={styles.hero}>Screen a payment event.</Text><Text style={styles.muted}>Local demonstration only. This does not connect to a bank, move money or approve a real payment.</Text>
          <Text style={styles.label}>AMOUNT (EUR)</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="950.00" placeholderTextColor={C.muted} style={styles.input}/>
          <Text style={styles.label}>REFERENCE</Text><TextInput value={reference} onChangeText={setReference} autoCapitalize="characters" placeholder="NX-2026-001" placeholderTextColor={C.muted} style={styles.input}/>
          <TouchableOpacity style={styles.primary} onPress={()=>setDecision(screening)}><Text style={styles.primaryText}>RUN DEMO SCREENING</Text></TouchableOpacity>
          {decision && <View style={[styles.result,{borderColor:decision==="ACCEPT"?C.green:decision==="REVIEW"?C.amber:C.red}]}><Text style={[styles.resultTitle,{color:decision==="ACCEPT"?C.green:decision==="REVIEW"?C.amber:C.red}]}>{decision}</Text><Text style={styles.muted}>Illustrative rule-based result. Production screening requires validated rules, audit controls and security testing.</Text></View>}
        </Card>
        <Text style={styles.section}>Decision outcomes</Text>
        <View style={styles.outcomes}><Text style={{color:C.green,fontWeight:"800"}}>ACCEPT</Text><Text style={{color:C.amber,fontWeight:"800"}}>REVIEW</Text><Text style={{color:C.red,fontWeight:"800"}}>REJECT</Text></View>
        <Text style={styles.note}>Duplicate-event protection and the separate API prototype remain part of the existing project. This mobile demo is not a regulated payment service.</Text>
      </>}
      {tab==="Payments" && <>
        <Card>
          <Text style={styles.kicker}>NEXORA PAYMENTS • MOLLIE</Text>
          <Text style={styles.hero}>Secure checkout for NEXORA services.</Text>
          <Text style={styles.muted}>Payments are handled on a secure provider checkout page. NEXORA never stores card or bank login details.</Text>
          <Text style={styles.label}>AMOUNT (EUR)</Text>
          <TextInput value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad" placeholder="19.90" placeholderTextColor={C.muted} style={styles.input}/>
          <Text style={styles.label}>SERVICE DESCRIPTION</Text>
          <TextInput value={paymentDescription} onChangeText={setPaymentDescription} maxLength={100} placeholder="NEXORA service" placeholderTextColor={C.muted} style={styles.input}/>
          <TouchableOpacity style={[styles.primary,paymentBusy&&{opacity:0.6}]} disabled={paymentBusy} onPress={startPayment}><Text style={styles.primaryText}>{paymentBusy?"PLEASE WAIT":"CONTINUE TO SECURE PAYMENT"}</Text></TouchableOpacity>
          {!!paymentOrderId && <TouchableOpacity style={styles.action} onPress={refreshPayment} disabled={paymentBusy}><View style={{flex:1}}><Text style={styles.actionTitle}>Check payment status</Text><Text style={styles.muted}>Current status: {paymentStatus || "unknown"}</Text></View><Text style={styles.arrow}>↻</Text></TouchableOpacity>}
          {!!paymentMessage && <Text style={styles.note}>{paymentMessage}</Text>}
        </Card>
        <Text style={styles.note}>This feature is enabled only after the NEXORA server has a Mollie API key and a verified merchant account. Test-mode payments do not transfer real money.</Text>
      </>}
      {tab==="Profile" && <>
        <Card>
          <Text style={styles.kicker}>NEXORA ACCOUNT</Text>
          {account ? <>
            <Text style={styles.hero}>You are signed in.</Text>
            <Text style={styles.muted}>{account.email}</Text>
            <TouchableOpacity style={styles.primary} onPress={signOut}><Text style={styles.primaryText}>SIGN OUT</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.action,{marginTop:12,borderColor:C.red}]} onPress={deleteAccount}><Text style={{color:C.red,fontWeight:"800"}}>DELETE ACCOUNT AND DATA</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>Linking.openURL("https://bnexora7-eng.github.io/nexora-business/privacy/")}><Text style={styles.note}>Privacy policy</Text></TouchableOpacity>
          </> : <>
            <Text style={styles.hero}>{authMode==="register"?"Create your NEXORA account.":"Welcome back."}</Text>
            <Text style={styles.muted}>An account will give you a personal profile across NEXORA services.</Text>
            <View style={{flexDirection:"row",gap:8,marginTop:16}}>
              <Pill label="Create account" active={authMode==="register"} onPress={()=>{setAuthMode("register");setAuthMessage("");}}/>
              <Pill label="Sign in" active={authMode==="login"} onPress={()=>{setAuthMode("login");setAuthMessage("");}}/>
            </View>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={C.muted} style={styles.input}/>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 12 characters" placeholderTextColor={C.muted} style={styles.input}/>
            {authMode==="register"&&<Text style={styles.note}>Use at least 12 characters. Your password is stored as a salted secure hash, not as plain text.</Text>}
            <TouchableOpacity style={[styles.primary,authBusy&&{opacity:0.6}]} disabled={authBusy} onPress={submitAuth}><Text style={styles.primaryText}>{authBusy?"PLEASE WAIT":authMode==="register"?"CREATE ACCOUNT":"SIGN IN"}</Text></TouchableOpacity>
            {!!authMessage&&<Text style={[styles.note,{marginBottom:0}]}>{authMessage}</Text>
            <TouchableOpacity onPress={()=>Linking.openURL("https://bnexora7-eng.github.io/nexora-business/privacy/")}><Text style={styles.note}>Read NEXORA Privacy Policy</Text></TouchableOpacity>}
            {!API_BASE&&<Text style={styles.note}>The account server must be deployed and connected before registration can work.</Text>}
          </>}
        </Card>
        <Card><Text style={styles.kicker}>MEMBERSHIP</Text><Text style={styles.hero}>Choose how you grow with NEXORA.</Text><Text style={styles.muted}>These plans are previews only. No subscription is charged in this build.</Text></Card>
        {["Free","Premium","Business"].map(p=><TouchableOpacity key={p} style={[styles.plan,plan===p&&styles.planSelected]} onPress={()=>setPlan(p)}><View style={{flex:1}}><Text style={styles.actionTitle}>{p}</Text><Text style={styles.muted}>{p==="Free"?"Core platform access":p==="Premium"?"Enhanced personal features":"Tools for companies and sellers"}</Text></View><Text style={{color:plan===p?C.cyan:C.muted,fontWeight:"800"}}>{plan===p?"SELECTED":"SELECT"}</Text></TouchableOpacity>)}
        <Text style={styles.note}>Paid memberships will be activated only after a compliant payment provider and subscription management are integrated. No bank details are requested here.</Text>
      </>}
    </ScrollView>
    <View style={styles.nav}>{(["Home","Community","Marketplace","Business","Integrity","Payments","Profile"] as Tab[]).map(t=><TouchableOpacity key={t} onPress={()=>go(t)} style={styles.navItem}><View style={[styles.navMark,tab===t&&styles.navMarkActive]}/><Text numberOfLines={1} style={[styles.navText,tab===t&&{color:C.cyan}]}>{t==="Marketplace"?"Market":t==="Community"?"Social":t==="Integrity"?"Check":t==="Payments"?"Pay":t}</Text></TouchableOpacity>)}</View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},header:{paddingHorizontal:20,paddingTop:12,paddingBottom:14,borderBottomWidth:1,borderColor:C.line,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 brand:{fontSize:25,fontWeight:"900",letterSpacing:2,color:C.text},tag:{fontSize:9,letterSpacing:2,color:C.muted,marginTop:2},status:{flexDirection:"row",alignItems:"center",gap:7,borderWidth:1,borderColor:C.line,borderRadius:20,paddingHorizontal:10,paddingVertical:7},dot:{width:7,height:7,borderRadius:5,backgroundColor:C.amber},statusText:{fontSize:9,fontWeight:"800",color:C.amber,letterSpacing:1},
 content:{padding:20,paddingBottom:30},eyebrow:{fontSize:10,fontWeight:"800",letterSpacing:2,color:C.cyan,marginBottom:8},heading:{fontSize:27,lineHeight:33,fontWeight:"800",color:C.text,marginBottom:18},card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:18,padding:18,marginBottom:18},kicker:{fontSize:10,fontWeight:"800",letterSpacing:1.7,color:C.cyan,marginBottom:12},hero:{fontSize:23,lineHeight:29,fontWeight:"800",color:C.text,marginBottom:10},muted:{fontSize:13,lineHeight:20,color:C.muted},tagRow:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:17},tagChip:{overflow:"hidden",fontSize:9,color:C.cyan,borderWidth:1,borderColor:C.line,borderRadius:20,paddingHorizontal:9,paddingVertical:6,letterSpacing:1,fontWeight:"800"},
 section:{fontSize:17,fontWeight:"800",color:C.text,marginTop:4,marginBottom:10},action:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:14,padding:15,marginBottom:9,flexDirection:"row",alignItems:"center"},actionTitle:{fontSize:15,fontWeight:"800",color:C.text,marginBottom:4},arrow:{fontSize:26,color:C.cyan,paddingLeft:10},note:{fontSize:12,lineHeight:19,color:C.muted,marginTop:12,marginBottom:14},label:{fontSize:10,fontWeight:"800",letterSpacing:1.5,color:C.muted,marginTop:14,marginBottom:7},input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.line,borderRadius:10,paddingHorizontal:13,paddingVertical:12,color:C.text,fontSize:15},
 primary:{backgroundColor:C.cyan,borderRadius:11,padding:15,alignItems:"center",marginTop:17},primaryText:{fontSize:12,fontWeight:"900",letterSpacing:1,color:C.bg},result:{borderWidth:1,borderRadius:12,padding:14,marginTop:15},resultTitle:{fontSize:21,fontWeight:"900",marginBottom:5},outcomes:{flexDirection:"row",justifyContent:"space-between",backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:12,padding:15},plan:{flexDirection:"row",alignItems:"center",backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:13,padding:15,marginBottom:10},planSelected:{borderColor:C.cyan,backgroundColor:C.panel2},nav:{height:66,borderTopWidth:1,borderColor:C.line,backgroundColor:C.bg,flexDirection:"row",alignItems:"center",justifyContent:"space-around",paddingHorizontal:4},navItem:{alignItems:"center",justifyContent:"center",flex:1,gap:5},navMark:{width:5,height:5,borderRadius:4,backgroundColor:C.line},navMarkActive:{width:18,backgroundColor:C.cyan},navText:{fontSize:9,color:C.muted,fontWeight:"700"},pill:{paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:C.line},pillActive:{backgroundColor:C.cyan,borderColor:C.cyan},pillText:{fontSize:11,fontWeight:"800",color:C.text}
});
