import React, { useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import AlpinossModules from "./NexoraModules";
import { API_BASE } from "./api";
import { Alert, BackHandler, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from "react-native";

type Tab = "Home" | "Community" | "Marketplace" | "Business" | "Integrity" | "Profile";
type Decision = "ACCEPT" | "REVIEW" | "REJECT";
type Account = { id: string; email: string; created_at: string; subscription_status?: string };

const C = { bg:"#08111F", panel:"#111E30", panel2:"#17263B", line:"#263A53", text:"#F3F7FC", muted:"#91A4BA", cyan:"#4b8dff", blue:"#6EA8FF", green:"#43D19E", amber:"#F5BD58", red:"#FF7777" };

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
  const [pendingVerificationEmail,setPendingVerificationEmail] = useState("");
  const [account,setAccount] = useState<Account|null>(null);
  const [decision,setDecision] = useState<Decision|null>(null);
  const [expandedArea,setExpandedArea] = useState<string|null>(null);


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
    if (!API_BASE) { setAuthMessage("Logowanie będzie dostępne po podłączeniu serwera ALPINOSS."); return; }
    if (!email.trim() || !password) { setAuthMessage("Wpisz adres e-mail i hasło."); return; }
    setAuthBusy(true);
    try {
      const response = await fetch(API_BASE + (authMode === "register" ? "/v1/auth/register" : "/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "email_not_verified") setPendingVerificationEmail(email.trim());
        throw new Error(data.error || "Nie udało się zalogować.");
      }
      if (data.status === "verification_required") {
        setPendingVerificationEmail(data.email || email.trim());
        setPassword("");
        setAuthMessage("Konto utworzone. Otwórz wiadomość e-mail od ALPINOSS i potwierdź adres. Dopiero wtedy możesz się zalogować.");
        return;
      }
      await SecureStore.setItemAsync("nexora_session", data.token);
      setAccount(data.user);
      setPassword("");
      setPendingVerificationEmail("");
      setAuthMessage("Zalogowano pomyślnie.");
    } catch (error) {
      if (error instanceof Error && /verification email could not be sent/i.test(error.message)) setPendingVerificationEmail(email.trim());
      setAuthMessage(error instanceof Error ? error.message : "Błąd połączenia.");
    } finally {
      setAuthBusy(false);
    }
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
      "Delete ALPINOSS account?",
      "This permanently deletes your account, posts, marketplace listings and business workspace. Payment records may be retained without your account link where legally required.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete account", style: "destructive", onPress: async () => {
          try {
            if (!API_BASE) {
              Alert.alert("Account not deleted", "The ALPINOSS account server is not configured. Your account has not been changed.");
              return;
            }
            const token = await SecureStore.getItemAsync("nexora_session");
            if (!token) {
              setAccount(null);
              Alert.alert("Sign in required", "Your session is no longer available. Sign in again before deleting the account.");
              return;
            }
            const response = await fetch(API_BASE + "/v1/auth/account", { method: "DELETE", headers: { Authorization: "Bearer " + token } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Account deletion failed.");
            await SecureStore.deleteItemAsync("nexora_session");
            setAccount(null); setPassword(""); setAuthMessage("Your ALPINOSS account and associated content have been deleted.");
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

  const go = (next:Tab) => { setTab(next); setDecision(null); setExpandedArea(null); };
  const areaCard = (area:string, index:string, description:string, actions:{title:string;subtitle:string;target:Tab}[]) => (
    <View style={styles.areaCard}>
      <View style={styles.areaAccent}/><View style={styles.areaCorner}/>
      <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:expandedArea===area}} onPress={()=>setExpandedArea(expandedArea===area?null:area)} style={styles.areaHead}>
        <View style={styles.areaIndex}><Text style={styles.areaIndexText}>{index}</Text></View>
        <View style={{flex:1}}><Text style={styles.areaTitle}>{area.toUpperCase()}</Text><Text style={styles.areaDescription}>{description}</Text></View>
        <Text style={styles.areaChevron}>{expandedArea===area?"−":"＋"}</Text>
      </TouchableOpacity>
      {expandedArea===area&&<View style={styles.areaActions}>{actions.map(a=><Action key={a.title} title={a.title} subtitle={a.subtitle} onPress={()=>go(a.target)}/>)}</View>}
    </View>
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (tab !== "Home") { setTab("Home"); setDecision(null); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [tab]);
  const heading:Record<Tab,string> = {
    Home:"What do you want to get done today?",
    Community:"ALPINOSS Community",
    Marketplace:"ALPINOSS Marketplace",
    Business:"Business Tools",
    Integrity:"Payment Integrity",
    Profile:"Your ALPINOSS account"
  };

  return <SafeAreaView style={styles.safe}>
    <View pointerEvents="none" style={styles.cosmicGlowTop}/><View pointerEvents="none" style={styles.cosmicGlowBottom}/><View pointerEvents="none" style={styles.starField}><View style={[styles.star,{top:38,left:"12%"}]}/><View style={[styles.star,{top:112,left:"82%"}]}/><View style={[styles.star,{top:245,left:"91%"}]}/><View style={[styles.star,{top:390,left:"7%"}]}/><View style={[styles.star,{top:560,left:"76%"}]}/><View style={[styles.star,{top:720,left:"18%"}]}/></View>
    <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
    <View style={styles.header}>
      <View style={{flexDirection:"row",alignItems:"center",gap:10}}><View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text><View style={styles.brandChip}/></View><View><Text style={styles.brand}>ALPINOSS</Text><Text style={styles.tag}>MANY POSSIBILITIES</Text></View></View>
      <TouchableOpacity onPress={()=>go("Profile")} style={styles.accountButton}><Text style={styles.accountButtonText}>ACCOUNT ↗</Text></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab!=="Home"&&<TouchableOpacity onPress={()=>go("Home")} style={styles.backLink}><Text style={styles.backLinkText}>‹  GLOBAL PLATFORM</Text></TouchableOpacity>}
      {tab==="Home"?<>
        <Text style={styles.globalLabel}>GLOBAL PLATFORM</Text>
        <View style={styles.brandHero}>
          <View style={styles.heroTopLine}><View style={styles.heroLine}/><Text style={styles.heroOverline}>A WORLD OF POSSIBILITIES</Text><View style={styles.heroLine}/></View>
          <Text style={styles.heroWordmark}>ALPINOSS</Text>
          <Text style={styles.heroTagline}>MANY POSSIBILITIES</Text>
          <View style={styles.planetStage}>
            <View style={styles.planetHalo}/><View style={styles.planetOrbit}/>
            <View style={styles.planet}><View style={styles.continentOne}/><View style={styles.continentTwo}/><View style={styles.continentThree}/><View style={styles.planetShade}/></View>
            <View style={styles.planetBase}/>
          </View>
          <View style={styles.heroBottom}><Text style={styles.heroBottomText}>CONNECT  •  CREATE  •  EXPLORE</Text></View>
        </View>
        <Text style={styles.homeIntro}>One connected space to build, explore, create and connect.</Text>
        <View style={styles.areaGrid}>
          {areaCard("Platform","01","Tools, plans and your personal workspace",[
            {title:"Business workspace",subtitle:"Build and manage your projects",target:"Business"},
            {title:"Account & profile",subtitle:"Sign in and manage your account",target:"Profile"}
          ])}
          {areaCard("Technology","02","AI, systems and digital infrastructure",[
            {title:"Payment Integrity",subtitle:"Open the payment screening demo",target:"Integrity"},
            {title:"Business tools",subtitle:"Explore your project workspace",target:"Business"}
          ])}
          {areaCard("Marketplace","03","Discover offers, products and services",[
            {title:"Explore marketplace",subtitle:"Browse and publish offers",target:"Marketplace"}
          ])}
          {areaCard("Community","04","People, ideas and shared opportunities",[
            {title:"Open community",subtitle:"Connect and share updates",target:"Community"}
          ])}
        </View>
        <Text style={styles.homeFoot}>ALPINOSS  •  MANY POSSIBILITIES</Text>
      </>:<>
        <Text style={styles.eyebrow}>{tab.toUpperCase()}</Text>
        <Text style={styles.heading}>{heading[tab]}</Text>
      </>}
      {(tab==="Community"||tab==="Marketplace"||tab==="Business")&&<AlpinossModules screen={tab} signedIn={!!account} onNavigate={go}/>}
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
      {tab==="Profile" && <>
        <Card>
          <Text style={styles.kicker}>ALPINOSS ACCOUNT</Text>
          {account ? <>
            <Text style={styles.hero}>You are signed in.</Text>
            <Text style={styles.muted}>{account.email}</Text>
            <TouchableOpacity style={styles.primary} onPress={signOut}><Text style={styles.primaryText}>SIGN OUT</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.action,{marginTop:12,borderColor:C.red}]} onPress={deleteAccount}><Text style={{color:C.red,fontWeight:"800"}}>DELETE ACCOUNT AND DATA</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>Linking.openURL("https://bnexora7-eng.github.io/nexora-business/privacy/")}><Text style={styles.note}>Privacy policy</Text></TouchableOpacity>
          </> : <>
            <Text style={styles.hero}>{authMode==="register"?"Create your ALPINOSS account.":"Welcome back."}</Text>
            <Text style={styles.muted}>An account will give you a personal profile across ALPINOSS services.</Text>
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
            {!!authMessage&&<Text style={[styles.note,{marginBottom:0}]}>{authMessage}</Text>}
            {!!pendingVerificationEmail&&<TouchableOpacity style={styles.action} onPress={async()=>{try{const response=await fetch(API_BASE+"/v1/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:pendingVerificationEmail})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Nie udało się wysłać wiadomości.");setAuthMessage("Jeśli konto oczekuje na potwierdzenie, wysłaliśmy nowy link na "+pendingVerificationEmail+".");}catch(error){setAuthMessage(error instanceof Error?error.message:"Błąd połączenia.");}}}><View style={{flex:1}}><Text style={styles.actionTitle}>Wyślij ponownie link aktywacyjny</Text><Text style={styles.muted}>{pendingVerificationEmail}</Text></View><Text style={styles.arrow}>›</Text></TouchableOpacity>}
            <TouchableOpacity onPress={()=>Linking.openURL("https://bnexora7-eng.github.io/nexora-business/account/forgot-password.html")}><Text style={styles.note}>Nie pamiętasz hasła? Odzyskaj konto</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>Linking.openURL("https://bnexora7-eng.github.io/nexora-business/privacy/")}><Text style={styles.note}>Read ALPINOSS Privacy Policy</Text></TouchableOpacity>
            {!API_BASE&&<Text style={styles.note}>The account server must be deployed and connected before registration can work.</Text>}
          </>}
        </Card>
      </>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
 safe:{flex:1,backgroundColor:"#050A14"},cosmicGlowTop:{position:"absolute",top:-140,right:-100,width:340,height:340,borderRadius:180,backgroundColor:"#102D5C",opacity:0.22},cosmicGlowBottom:{position:"absolute",bottom:40,left:-150,width:340,height:340,borderRadius:180,backgroundColor:"#4A102A",opacity:0.16},starField:{...StyleSheet.absoluteFillObject},star:{position:"absolute",width:3,height:3,borderRadius:2,backgroundColor:"#A9D5FF",opacity:0.8,shadowColor:"#4B9DFF",shadowOpacity:1,shadowRadius:6},header:{paddingHorizontal:20,paddingTop:12,paddingBottom:14,borderBottomWidth:1,borderColor:C.line,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},accountButton:{borderWidth:1,borderColor:C.cyan,borderRadius:8,paddingHorizontal:11,paddingVertical:9},accountButtonText:{fontSize:9,fontWeight:"900",letterSpacing:1,color:C.cyan},backLink:{marginBottom:16,alignSelf:"flex-start",paddingVertical:7},backLinkText:{fontSize:10,fontWeight:"900",letterSpacing:1.5,color:C.cyan},globalLabel:{fontSize:10,fontWeight:"900",letterSpacing:3,color:"#FF5366",marginBottom:12},brandHero:{minHeight:278,backgroundColor:"#080F1D",borderWidth:1,borderColor:"#29476B",borderRadius:20,overflow:"hidden",alignItems:"center",paddingTop:17,marginBottom:22,shadowColor:"#1769D2",shadowOpacity:0.25,shadowRadius:18,elevation:8},heroTopLine:{width:"86%",flexDirection:"row",alignItems:"center",gap:9},heroLine:{height:1,flex:1,backgroundColor:"#3C5E85"},heroOverline:{fontSize:7,fontWeight:"900",letterSpacing:2,color:"#8FB6E9"},heroWordmark:{fontSize:34,fontWeight:"900",letterSpacing:4,color:"#E9F3FF",marginTop:14,textShadowColor:"#4E9DFF",textShadowRadius:12,textShadowOffset:{width:0,height:2}},heroTagline:{fontSize:9,fontWeight:"900",letterSpacing:4,color:"#E34D63",marginTop:3},planetStage:{height:145,width:"100%",alignItems:"center",justifyContent:"center",marginTop:0},planetHalo:{position:"absolute",width:184,height:108,borderRadius:100,backgroundColor:"#155CB4",opacity:0.16},planetOrbit:{position:"absolute",width:205,height:85,borderWidth:1,borderColor:"#4D9BFF",borderRadius:100,transform:[{rotate:"-13deg"}],opacity:0.55},planet:{width:104,height:104,borderRadius:60,backgroundColor:"#1267C7",borderWidth:2,borderColor:"#8BCBFF",overflow:"hidden",shadowColor:"#168BFF",shadowOpacity:0.95,shadowRadius:22,elevation:14},continentOne:{position:"absolute",width:43,height:25,backgroundColor:"#61B9A1",borderRadius:16,top:18,left:12,transform:[{rotate:"-25deg"}]},continentTwo:{position:"absolute",width:27,height:42,backgroundColor:"#459C88",borderRadius:15,top:47,left:48,transform:[{rotate:"18deg"}]},continentThree:{position:"absolute",width:22,height:15,backgroundColor:"#79C5A5",borderRadius:12,top:65,left:16,transform:[{rotate:"-12deg"}]},planetShade:{position:"absolute",right:-15,top:-8,width:70,height:125,borderRadius:50,backgroundColor:"#04172F",opacity:0.48},planetBase:{position:"absolute",bottom:10,width:140,height:9,borderRadius:20,backgroundColor:"#2D8BFF",opacity:0.2},heroBottom:{width:"100%",borderTopWidth:1,borderColor:"#203753",paddingVertical:10,alignItems:"center",backgroundColor:"#0B1728"},heroBottomText:{fontSize:8,fontWeight:"900",letterSpacing:2,color:"#8DAED5"},homeIntro:{fontSize:14,lineHeight:22,color:C.muted,marginTop:-8,marginBottom:22},areaGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12},areaCard:{width:"47%",minHeight:154,backgroundColor:"#0C192B",borderWidth:1,borderColor:"#315071",borderRadius:15,overflow:"hidden",marginBottom:2,shadowColor:"#1769D2",shadowOpacity:0.16,shadowRadius:9,elevation:4},areaAccent:{position:"absolute",left:0,top:0,bottom:0,width:3,backgroundColor:"#3D8EFF"},areaCorner:{position:"absolute",right:-22,top:-22,width:64,height:64,borderWidth:1,borderColor:"#294A70",transform:[{rotate:"45deg"}]},areaHead:{minHeight:152,padding:13,paddingLeft:16,justifyContent:"space-between"},areaIndex:{width:28,height:24,borderWidth:1,borderColor:C.cyan,alignItems:"center",justifyContent:"center",borderRadius:5},areaIndexText:{fontSize:9,fontWeight:"900",color:C.cyan,letterSpacing:1},areaTitle:{fontSize:15,fontWeight:"900",letterSpacing:1,color:C.text,marginTop:14},areaDescription:{fontSize:11,lineHeight:16,color:C.muted,marginTop:5},areaChevron:{position:"absolute",right:12,top:12,fontSize:18,color:C.cyan,fontWeight:"700"},areaActions:{paddingHorizontal:9,paddingBottom:9,borderTopWidth:1,borderColor:C.line},homeFoot:{fontSize:9,fontWeight:"800",letterSpacing:2,color:C.muted,textAlign:"center",marginTop:22},
 brandMark:{width:42,height:42,borderRadius:11,borderWidth:1,borderColor:"#79B8FF",backgroundColor:"#101F35",alignItems:"center",justifyContent:"center",position:"relative",shadowColor:C.cyan,shadowOpacity:0.55,shadowRadius:12,elevation:5},brandMarkText:{fontSize:25,fontWeight:"900",color:"#E8F4FF",letterSpacing:-2,textShadowColor:"#5AA7FF",textShadowRadius:9,textShadowOffset:{width:0,height:1}},brandChip:{position:"absolute",width:9,height:9,right:-3,bottom:-3,borderRadius:2,backgroundColor:C.cyan,borderWidth:2,borderColor:C.bg},brand:{fontSize:25,fontWeight:"900",letterSpacing:2,color:C.text},tag:{fontSize:9,letterSpacing:2,color:C.muted,marginTop:2},status:{flexDirection:"row",alignItems:"center",gap:7,borderWidth:1,borderColor:C.line,borderRadius:20,paddingHorizontal:10,paddingVertical:7},dot:{width:7,height:7,borderRadius:5,backgroundColor:C.amber},statusText:{fontSize:9,fontWeight:"800",color:C.amber,letterSpacing:1},
 content:{padding:20,paddingBottom:30},eyebrow:{fontSize:10,fontWeight:"800",letterSpacing:2,color:C.cyan,marginBottom:8},heading:{fontSize:27,lineHeight:33,fontWeight:"800",color:C.text,marginBottom:18},card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:18,padding:18,marginBottom:18},kicker:{fontSize:10,fontWeight:"800",letterSpacing:1.7,color:C.cyan,marginBottom:12},hero:{fontSize:23,lineHeight:29,fontWeight:"800",color:C.text,marginBottom:10},muted:{fontSize:13,lineHeight:20,color:C.muted},tagRow:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:17},tagChip:{overflow:"hidden",fontSize:9,color:C.cyan,borderWidth:1,borderColor:C.line,borderRadius:20,paddingHorizontal:9,paddingVertical:6,letterSpacing:1,fontWeight:"800"},
 section:{fontSize:17,fontWeight:"800",color:C.text,marginTop:4,marginBottom:10},action:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:14,padding:15,marginBottom:9,flexDirection:"row",alignItems:"center"},actionTitle:{fontSize:15,fontWeight:"800",color:C.text,marginBottom:4},arrow:{fontSize:26,color:C.cyan,paddingLeft:10},note:{fontSize:12,lineHeight:19,color:C.muted,marginTop:12,marginBottom:14},label:{fontSize:10,fontWeight:"800",letterSpacing:1.5,color:C.muted,marginTop:14,marginBottom:7},input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.line,borderRadius:10,paddingHorizontal:13,paddingVertical:12,color:C.text,fontSize:15},
 primary:{backgroundColor:C.cyan,borderRadius:11,padding:15,alignItems:"center",marginTop:17},primaryText:{fontSize:12,fontWeight:"900",letterSpacing:1,color:C.bg},result:{borderWidth:1,borderRadius:12,padding:14,marginTop:15},resultTitle:{fontSize:21,fontWeight:"900",marginBottom:5},outcomes:{flexDirection:"row",justifyContent:"space-between",backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:12,padding:15},plan:{flexDirection:"row",alignItems:"center",backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:13,padding:15,marginBottom:10},planSelected:{borderColor:C.cyan,backgroundColor:C.panel2},nav:{height:66,borderTopWidth:1,borderColor:C.line,backgroundColor:C.bg,flexDirection:"row",alignItems:"center",justifyContent:"space-around",paddingHorizontal:4},navItem:{alignItems:"center",justifyContent:"center",flex:1,gap:5},navMark:{width:5,height:5,borderRadius:4,backgroundColor:C.line},navMarkActive:{width:18,backgroundColor:C.cyan},navText:{fontSize:9,color:C.muted,fontWeight:"700"},pill:{paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:C.line},pillActive:{backgroundColor:C.cyan,borderColor:C.cyan},pillText:{fontSize:11,fontWeight:"800",color:C.text}
});
