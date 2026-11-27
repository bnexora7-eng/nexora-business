import React, { useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import AlpinossModules from "./NexoraModules";
import { API_BASE, apiRequest } from "./api";
import { Alert, BackHandler, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking } from "react-native";

type Tab = "Home" | "Community" | "Marketplace" | "Business" | "Integrity" | "Profile";
type Decision = "ACCEPT" | "REVIEW" | "REJECT";
type Account = { id: string; email: string; display_name?: string; created_at: string; subscription_status?: string };

const C = { bg:"#08111F", panel:"#111E30", panel2:"#17263B", line:"#263A53", text:"#F3F7FC", muted:"#91A4BA", cyan:"#4b8dff", blue:"#6EA8FF", green:"#43D19E", amber:"#F5BD58", red:"#FF7777" };

function Pill({label,active,onPress}:{label:string;active?:boolean;onPress:()=>void}) {
  return <TouchableOpacity onPress={onPress} style={[styles.pill,active&&styles.pillActive]}><Text style={[styles.pillText,active&&{color:C.bg}]}>{label}</Text></TouchableOpacity>;
}
function Card({children}:{children:React.ReactNode}) { return <View style={styles.card}>{children}</View>; }
function Action({title,subtitle,onPress}:{title:string;subtitle:string;onPress:()=>void}) {
  return <TouchableOpacity style={styles.action} onPress={onPress}><View style={{flex:1}}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.muted}>{subtitle}</Text></View><Text style={styles.arrow}>›</Text></TouchableOpacity>;
}

export default function App() {
  const [tab,setTab] = useState<Tab>("Profile");
  const [amount,setAmount] = useState("950");
  const [reference,setReference] = useState("NX-2026-001");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [authMode,setAuthMode] = useState<"login"|"register">("login");
  const [authBusy,setAuthBusy] = useState(false);
  const [authMessage,setAuthMessage] = useState("");
  const [pendingVerificationEmail,setPendingVerificationEmail] = useState("");
  const [account,setAccount] = useState<Account|null>(null);
  const [profileName,setProfileName] = useState("");
  const [profileBusy,setProfileBusy] = useState(false);
  const [decision,setDecision] = useState<Decision|null>(null);
  const [expandedArea,setExpandedArea] = useState<string|null>(null);


  useEffect(() => {
    let active = true;
    (async () => {
      if (!API_BASE) { if (active) setAuthMessage("Serwer konta nie jest jeszcze podłączony."); return; }
      try {
        const token = await SecureStore.getItemAsync("nexora_session");
        if (!token) return;
        const { ok, status, data } = await apiRequest("/v1/auth/me", { headers: { Authorization: "Bearer " + token } });
        if (!ok) {
          if (status === 401 || status === 403) {
            await SecureStore.deleteItemAsync("nexora_session");
          } else if (active) {
            setAuthMessage(data.error || "Nie udało się teraz sprawdzić sesji. Spróbuj ponownie.");
          }
          return;
        }
        if (active) { setAccount(data.user); setProfileName(data.user.display_name||""); }
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
      const { ok, data } = await apiRequest(authMode === "register" ? "/v1/auth/register" : "/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      if (!ok) {
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
      setProfileName(data.user.display_name||"");
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

  const saveProfile = async () => {
    const name=profileName.trim().replace(/\s+/g," ");
    if(name.length<2||name.length>40||/[<>]/.test(name)){setAuthMessage("Nazwa profilu musi mieć od 2 do 40 znaków.");return;}
    setProfileBusy(true);
    try{
      const token=await SecureStore.getItemAsync("nexora_session");
      if(!token) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      const {ok,data}=await apiRequest("/v1/auth/profile",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({display_name:name})});
      if(!ok) throw new Error(data.error||"Nie udało się zapisać profilu.");
      setAccount(data.user);setProfileName(data.user.display_name||"");setAuthMessage("Profil został zapisany.");
    }catch(error){setAuthMessage(error instanceof Error?error.message:"Błąd zapisu profilu.");}
    finally{setProfileBusy(false);}
  };

  const signOut = async () => {
    try {
      const token = await SecureStore.getItemAsync("nexora_session");
      if (token && API_BASE) await apiRequest("/v1/auth/logout", { method: "POST", headers: { Authorization: "Bearer " + token } }, 8000);
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
            const { ok, data } = await apiRequest("/v1/auth/account", { method: "DELETE", headers: { Authorization: "Bearer " + token } });
            if (!ok) throw new Error(data.error || "Account deletion failed.");
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
    <View pointerEvents="none" style={styles.bioStructure}><View style={styles.bioSpineLeft}/><View style={styles.bioSpineRight}/><View style={styles.bioCrossbarTop}/><View style={styles.bioCrossbarBottom}/><View style={styles.bioNodeTopLeft}/><View style={styles.bioNodeTopRight}/><View style={styles.bioNodeBottomLeft}/><View style={styles.bioNodeBottomRight}/><View style={styles.bioCableOne}/><View style={styles.bioCableTwo}/></View>
    <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
    <View style={styles.header}>
      <View style={{flexDirection:"row",alignItems:"center",gap:10}}><Image source={require("./assets/alpinoss-official.jpg")} style={{width:54,height:54}} resizeMode="contain"/><View><Text style={styles.brand}>ALPINOSS</Text><Text style={styles.tag}>NEXT LEVEL TOGETHER</Text></View></View>
      <TouchableOpacity onPress={()=>go("Profile")} style={styles.accountButton}><Text style={styles.accountButtonText}>ACCOUNT ↗</Text></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab!=="Home"&&<TouchableOpacity onPress={()=>go("Home")} style={styles.backLink}><Text style={styles.backLinkText}>‹  GLOBAL PLATFORM</Text></TouchableOpacity>}
      {tab==="Home"?<>
        <Text style={styles.globalLabel}>GLOBAL PLATFORM</Text>
        <View style={styles.brandHero}>
          <View style={styles.heroTopLine}><View style={styles.heroLine}/><Text style={styles.heroOverline}>A WORLD OF POSSIBILITIES</Text><View style={styles.heroLine}/></View>
          <View style={styles.heroWordmarkStage}>
            <Image source={require("./assets/alpinoss-official.jpg")} style={{width:"92%",height:132}} resizeMode="contain"/>
            <View style={styles.wordmarkUnderline}/>
            <Text style={styles.heroTagline}>MANY POSSIBILITIES</Text>
          </View>
          <View style={styles.heroBottom}><Text style={styles.heroBottomText}>CONNECT  •  CREATE  •  EXPLORE</Text></View>
        </View>
        <Text style={styles.homeIntro}>Technology, marketplace and community — built to move ideas forward.</Text>
        <View style={styles.areaGrid}>
          {areaCard("Technology","01","AI, systems and digital infrastructure",[
            {title:"Business workspace",subtitle:"Build and manage your projects",target:"Business"},
            {title:"Payment Integrity",subtitle:"Open the payment screening demo",target:"Integrity"}
          ])}
          {areaCard("Marketplace","02","Discover offers, products and services",[
            {title:"Explore marketplace",subtitle:"Browse and publish offers",target:"Marketplace"}
          ])}
          {areaCard("Community","03","People, ideas and shared opportunities",[
            {title:"Open community",subtitle:"Connect and share updates",target:"Community"}
          ])}
          {areaCard("Prices","04","One-off project fees. Scope and price to discuss.",[
            {title:"Request a project quote",subtitle:"Discuss scope, timing and budget",target:"Business"}
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
        <View style={styles.accountHero}>
          <Image source={require("./assets/alpinoss-official.jpg")} style={styles.accountHeroLogo} resizeMode="contain"/>
          <Text style={styles.accountHeroTitle}>GLOBAL PLATFORM</Text>
          <Text style={styles.accountHeroSubtitle}>MANY POSSIBILITIES  •  NEXT LEVEL TOGETHER</Text>
        </View>
        <Card>
          <Text style={styles.kicker}>ALPINOSS ACCOUNT</Text>
          {account ? <>
            <Text style={styles.hero}>You are signed in.</Text>
            <Text style={styles.muted}>{account.email}</Text>
            <Text style={styles.label}>PUBLIC DISPLAY NAME</Text>
            <TextInput value={profileName} onChangeText={setProfileName} maxLength={40} placeholder="Your name in the community" placeholderTextColor={C.muted} style={styles.input}/>
            <TouchableOpacity style={[styles.primary,profileBusy&&{opacity:0.6}]} disabled={profileBusy} onPress={saveProfile}><Text style={styles.primaryText}>{profileBusy?"SAVING…":"SAVE PROFILE"}</Text></TouchableOpacity>
            {!!authMessage&&<Text accessibilityRole="alert" style={styles.note}>{authMessage}</Text>}
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
            {!!pendingVerificationEmail&&<TouchableOpacity style={styles.action} onPress={async()=>{try{const {ok,data}=await apiRequest("/v1/auth/resend-verification",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:pendingVerificationEmail})});if(!ok)throw new Error(data.error||"Nie udało się wysłać wiadomości.");setAuthMessage("Jeśli konto oczekuje na potwierdzenie, wysłaliśmy nowy link na "+pendingVerificationEmail+".");}catch(error){setAuthMessage(error instanceof Error?error.message:"Błąd połączenia.");}}}><View style={{flex:1}}><Text style={styles.actionTitle}>Wyślij ponownie link aktywacyjny</Text><Text style={styles.muted}>{pendingVerificationEmail}</Text></View><Text style={styles.arrow}>›</Text></TouchableOpacity>}
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
 safe:{flex:1,backgroundColor:"#030711"}, accountHero:{backgroundColor:"#0A1728",borderWidth:1,borderColor:"#24476A",borderRadius:18,paddingVertical:18,paddingHorizontal:14,alignItems:"center",marginBottom:14,overflow:"hidden"},accountHeroLogo:{width:"100%",height:116},accountHeroTitle:{fontSize:12,fontWeight:"900",letterSpacing:3,color:"#D9EAFE",marginTop:8},accountHeroSubtitle:{fontSize:9,fontWeight:"800",letterSpacing:1.2,color:"#6EA8FF",marginTop:7,textAlign:"center"},cosmicGlowTop:{position:"absolute",top:-140,right:-100,width:360,height:360,borderRadius:180,backgroundColor:"#0B4A88",opacity:0.24},cosmicGlowBottom:{position:"absolute",bottom:40,left:-150,width:360,height:360,borderRadius:180,backgroundColor:"#68152F",opacity:0.17},starField:{...StyleSheet.absoluteFillObject},bioStructure:{...StyleSheet.absoluteFillObject,opacity:0.48},bioSpineLeft:{position:"absolute",left:5,top:90,bottom:70,width:2,backgroundColor:"#1B5C91",opacity:0.45},bioSpineRight:{position:"absolute",right:5,top:130,bottom:95,width:2,backgroundColor:"#713044",opacity:0.42},bioCrossbarTop:{position:"absolute",top:118,left:0,right:0,height:1,backgroundColor:"#2D5B80",opacity:0.25},bioCrossbarBottom:{position:"absolute",bottom:145,left:0,right:0,height:1,backgroundColor:"#25496C",opacity:0.3},bioNodeTopLeft:{position:"absolute",top:112,left:1,width:12,height:12,borderWidth:1,borderColor:"#398ED0",backgroundColor:"#07172A",transform:[{rotate:"45deg"}]},bioNodeTopRight:{position:"absolute",top:124,right:1,width:12,height:12,borderWidth:1,borderColor:"#A33B56",backgroundColor:"#170D1B",transform:[{rotate:"45deg"}]},bioNodeBottomLeft:{position:"absolute",bottom:139,left:1,width:10,height:10,borderWidth:1,borderColor:"#398ED0",backgroundColor:"#07172A",transform:[{rotate:"45deg"}]},bioNodeBottomRight:{position:"absolute",bottom:139,right:1,width:10,height:10,borderWidth:1,borderColor:"#A33B56",backgroundColor:"#170D1B",transform:[{rotate:"45deg"}]},bioCableOne:{position:"absolute",top:210,left:-38,width:130,height:1,backgroundColor:"#2789D0",opacity:0.4,transform:[{rotate:"-28deg"}]},bioCableTwo:{position:"absolute",top:390,right:-38,width:130,height:1,backgroundColor:"#9A304D",opacity:0.35,transform:[{rotate:"28deg"}]},star:{position:"absolute",width:3,height:3,borderRadius:2,backgroundColor:"#A9D5FF",opacity:0.8,shadowColor:"#4B9DFF",shadowOpacity:1,shadowRadius:6},header:{paddingHorizontal:20,paddingTop:12,paddingBottom:14,borderBottomWidth:1,borderColor:C.line,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},accountButton:{borderWidth:1,borderColor:C.cyan,borderRadius:8,paddingHorizontal:11,paddingVertical:9},accountButtonText:{fontSize:9,fontWeight:"900",letterSpacing:1,color:C.cyan},backLink:{marginBottom:16,alignSelf:"flex-start",paddingVertical:7},backLinkText:{fontSize:10,fontWeight:"900",letterSpacing:1.5,color:C.cyan},globalLabel:{fontSize:10,fontWeight:"900",letterSpacing:3,color:"#FF5366",marginBottom:12},brandHero:{minHeight:278,backgroundColor:"#070D18",borderWidth:1,borderColor:"#315B80",borderRadius:12,overflow:"hidden",alignItems:"center",paddingTop:17,marginBottom:22,shadowColor:"#168BFF",shadowOpacity:0.34,shadowRadius:22,elevation:9},heroTopLine:{width:"86%",flexDirection:"row",alignItems:"center",gap:9},heroLine:{height:1,flex:1,backgroundColor:"#3C5E85"},heroOverline:{fontSize:7,fontWeight:"900",letterSpacing:2,color:"#8FB6E9"},heroWordmarkStage:{flex:1,width:"100%",alignItems:"center",justifyContent:"center",paddingHorizontal:14},heroWordmark:{fontSize:35,fontWeight:"900",letterSpacing:3,color:"#E9F3FF",marginTop:8,textShadowColor:"#4E9DFF",textShadowRadius:18,textShadowOffset:{width:0,height:2}},wordmarkUnderline:{width:"58%",height:2,marginTop:14,backgroundColor:"#4B9DFF",shadowColor:"#168BFF",shadowOpacity:1,shadowRadius:10,elevation:5},heroTagline:{fontSize:9,fontWeight:"900",letterSpacing:4,color:"#E34D63",marginTop:3},heroBottom:{width:"100%",borderTopWidth:1,borderColor:"#203753",paddingVertical:10,alignItems:"center",backgroundColor:"#0B1728"},heroBottomText:{fontSize:8,fontWeight:"900",letterSpacing:2,color:"#8DAED5"},homeIntro:{fontSize:14,lineHeight:22,color:C.muted,marginTop:-8,marginBottom:22},areaGrid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:12},areaCard:{width:"47%",minHeight:154,backgroundColor:"#091525",borderWidth:1,borderColor:"#3B6488",borderRadius:12,overflow:"hidden",marginBottom:2,shadowColor:"#168BFF",shadowOpacity:0.28,shadowRadius:12,elevation:6},areaAccent:{position:"absolute",left:0,top:0,bottom:0,width:3,backgroundColor:"#39A7FF",shadowColor:"#39A7FF",shadowOpacity:0.9,shadowRadius:7},areaCorner:{position:"absolute",right:-22,top:-22,width:64,height:64,borderWidth:1,borderColor:"#47769C",backgroundColor:"#15304A",opacity:0.45,transform:[{rotate:"45deg"}]},areaHead:{minHeight:152,padding:13,paddingLeft:16,justifyContent:"space-between",backgroundColor:"#0A1A2D"},areaIndex:{width:30,height:26,borderWidth:1,borderColor:"#65B9FF",alignItems:"center",justifyContent:"center",borderRadius:3,backgroundColor:"#102B45",transform:[{skewX:"-7deg"}]},areaIndexText:{fontSize:9,fontWeight:"900",color:C.cyan,letterSpacing:1},areaTitle:{fontSize:15,fontWeight:"900",letterSpacing:1,color:C.text,marginTop:14},areaDescription:{fontSize:11,lineHeight:16,color:C.muted,marginTop:5},areaChevron:{position:"absolute",right:12,top:12,fontSize:18,color:C.cyan,fontWeight:"700"},areaActions:{paddingHorizontal:9,paddingBottom:9,borderTopWidth:1,borderColor:"#315A7D",backgroundColor:"#071321"},homeFoot:{fontSize:9,fontWeight:"800",letterSpacing:2,color:C.muted,textAlign:"center",marginTop:22},
 brandMark:{width:42,height:42,borderRadius:11,borderWidth:1,borderColor:"#79B8FF",backgroundColor:"#101F35",alignItems:"center",justifyContent:"center",position:"relative",shadowColor:C.cyan,shadowOpacity:0.55,shadowRadius:12,elevation:5},brandMarkText:{fontSize:25,fontWeight:"900",color:"#E8F4FF",letterSpacing:-2,textShadowColor:"#5AA7FF",textShadowRadius:9,textShadowOffset:{width:0,height:1}},brandChip:{position:"absolute",width:9,height:9,right:-3,bottom:-3,borderRadius:2,backgroundColor:C.cyan,borderWidth:2,borderColor:C.bg},brand:{fontSize:25,fontWeight:"900",letterSpacing:2,color:C.text},tag:{fontSize:9,letterSpacing:2,color:C.muted,marginTop:2},status:{flexDirection:"row",alignItems:"center",gap:7,borderWidth:1,borderColor:C.line,borderRadius:20,paddingHorizontal:10,paddingVertical:7},dot:{width:7,height:7,borderRadius:5,backgroundColor:C.amber},statusText:{fontSize:9,fontWeight:"800",color:C.amber,letterSpacing:1},
 content:{padding:20,paddingBottom:30},eyebrow:{fontSize:10,fontWeight:"800",letterSpacing:2,color:C.cyan,marginBottom:8},heading:{fontSize:27,lineHeight:33,fontWeight:"800",color:C.text,marginBottom:18},card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:18,padding:18,marginBottom:18},kicker:{fontSize:10,fontWeight:"800",letterSpacing:1.7,color:C.cyan,marginBottom:12},hero:{fontSize:23,lineHeight:29,fontWeight:"800",color:C.text,marginBottom:10},muted:{fontSize:13,lineHeight:20,color:C.muted},tagRow:{flexDirection:"row",gap:7,flexWrap:"wrap",marginTop:17},tagChip:{overflow:"hidden",fontSize:9,color:C.cyan,borderWidth:1,borderColor:C.line,borderRadius:20,paddingHorizontal:9,paddingVertical:6,letterSpacing:1,fontWeight:"800"},
 section:{fontSize:17,fontWeight:"800",color:C.text,marginTop:4,marginBottom:10},action:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:14,padding:15,marginBottom:9,flexDirection:"row",alignItems:"center"},actionTitle:{fontSize:15,fontWeight:"800",color:C.text,marginBottom:4},arrow:{fontSize:26,color:C.cyan,paddingLeft:10},note:{fontSize:12,lineHeight:19,color:C.muted,marginTop:12,marginBottom:14},label:{fontSize:10,fontWeight:"800",letterSpacing:1.5,color:C.muted,marginTop:14,marginBottom:7},input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.line,borderRadius:10,paddingHorizontal:13,paddingVertical:12,color:C.text,fontSize:15},
 primary:{backgroundColor:C.cyan,borderRadius:11,padding:15,alignItems:"center",marginTop:17},primaryText:{fontSize:12,fontWeight:"900",letterSpacing:1,color:C.bg},result:{borderWidth:1,borderRadius:12,padding:14,marginTop:15},resultTitle:{fontSize:21,fontWeight:"900",marginBottom:5},outcomes:{flexDirection:"row",justifyContent:"space-between",backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:12,padding:15},plan:{flexDirection:"row",alignItems:"center",backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:13,padding:15,marginBottom:10},planSelected:{borderColor:C.cyan,backgroundColor:C.panel2},nav:{height:66,borderTopWidth:1,borderColor:C.line,backgroundColor:C.bg,flexDirection:"row",alignItems:"center",justifyContent:"space-around",paddingHorizontal:4},navItem:{alignItems:"center",justifyContent:"center",flex:1,gap:5},navMark:{width:5,height:5,borderRadius:4,backgroundColor:C.line},navMarkActive:{width:18,backgroundColor:C.cyan},navText:{fontSize:9,color:C.muted,fontWeight:"700"},pill:{paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:1,borderColor:C.line},pillActive:{backgroundColor:C.cyan,borderColor:C.cyan},pillText:{fontSize:11,fontWeight:"800",color:C.text}
});
