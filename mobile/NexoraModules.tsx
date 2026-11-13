import React, { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import BusinessStudio from "./BusinessStudio";
import { API_BASE as API } from "./api";

const C = { bg:"#08111F", panel:"#111E30", line:"#263A53", text:"#F3F7FC", muted:"#91A4BA", cyan:"#4DE1D2" };
const styles = {
  card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:16,padding:16,marginBottom:14},
  title:{fontSize:21,fontWeight:"800" as const,color:C.text,marginBottom:8},
  text:{fontSize:13,lineHeight:20,color:C.muted},
  label:{fontSize:10,fontWeight:"800" as const,color:C.muted,marginTop:12,marginBottom:6},
  input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.line,borderRadius:9,padding:12,color:C.text},
  button:{backgroundColor:C.cyan,borderRadius:10,padding:14,alignItems:"center" as const,marginTop:12},
  buttonText:{fontSize:12,fontWeight:"900" as const,color:C.bg},
  note:{fontSize:12,color:C.cyan,marginTop:10,lineHeight:18}
};

export default function NexoraModules({screen,signedIn}:{screen:"Community"|"Marketplace"|"Business";signedIn:boolean}) {
  const [posts,setPosts]=useState<any[]>([]);
  const [post,setPost]=useState("");
  const [message,setMessage]=useState("");
  const [offers,setOffers]=useState<any[]>([]);
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [price,setPrice]=useState("0");
  const [category,setCategory]=useState("service");
  const [businessName,setBusinessName]=useState("");
  const [tagline,setTagline]=useState("");
  const [goals,setGoals]=useState("");
  const [busy,setBusy]=useState(false);

  const token=async()=>await SecureStore.getItemAsync("nexora_session");
  const loadPosts=async()=>{try{const r=await fetch(API+"/v1/community/posts");const d=await r.json();if(!r.ok)throw new Error(d.error);setPosts(d.posts||[]);setMessage("");}catch(e){setMessage(e instanceof Error?e.message:"Community unavailable.");}};
  const loadOffers=async()=>{try{const r=await fetch(API+"/v1/marketplace/listings");const d=await r.json();if(!r.ok)throw new Error(d.error);setOffers(d.listings||[]);setMessage("");}catch(e){setMessage(e instanceof Error?e.message:"Marketplace unavailable.");}};
  const loadWorkspace=async()=>{try{const t=await token();const r=await fetch(API+"/v1/business/workspace",{headers:{Authorization:"Bearer "+t}});const d=await r.json();if(!r.ok)throw new Error(d.error);setBusinessName(d.workspace.business_name||"");setTagline(d.workspace.tagline||"");setGoals(d.workspace.goals||"");}catch(e){setMessage(e instanceof Error?e.message:"Workspace unavailable.");}};
  useEffect(()=>{if(screen==="Community")loadPosts();if(screen==="Marketplace")loadOffers();if(screen==="Business"&&signedIn)loadWorkspace();},[screen,signedIn]);

  const publishPost=async()=>{if(!signedIn){setMessage("Sign in in Profile to publish.");return;}if(!post.trim()){setMessage("Write a post first.");return;}setBusy(true);try{const t=await token();const r=await fetch(API+"/v1/community/posts",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({body:post})});const d=await r.json();if(!r.ok)throw new Error(d.error);setPosts(p=>[d.post,...p]);setPost("");setMessage("Post published.");}catch(e){setMessage(e instanceof Error?e.message:"Could not publish.");}finally{setBusy(false);}};
  const publishOffer=async()=>{if(!signedIn){setMessage("Sign in in Profile to publish an offer.");return;}setBusy(true);try{const t=await token();const r=await fetch(API+"/v1/marketplace/listings",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({title,description,price,category})});const d=await r.json();if(!r.ok)throw new Error(d.error);setOffers(p=>[d.listing,...p]);setTitle("");setDescription("");setPrice("0");setMessage("Offer published. Checkout is not enabled yet.");}catch(e){setMessage(e instanceof Error?e.message:"Could not publish offer.");}finally{setBusy(false);}};
  const saveWorkspace=async()=>{if(!signedIn){setMessage("Sign in in Profile to save your workspace.");return;}setBusy(true);try{const t=await token();const r=await fetch(API+"/v1/business/workspace",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+t},body:JSON.stringify({business_name:businessName,tagline,goals})});const d=await r.json();if(!r.ok)throw new Error(d.error);setMessage("Workspace saved to your account.");}catch(e){setMessage(e instanceof Error?e.message:"Could not save workspace.");}finally{setBusy(false);}};

  const field=(label:string,value:string,onChange:(v:string)=>void,placeholder:string,multiline=false)=><><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.muted} multiline={multiline} style={[styles.input,multiline?{minHeight:90,textAlignVertical:"top" as const}:{}]}/></>;
  const button=(label:string,onPress:()=>void)=><TouchableOpacity disabled={busy} style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{busy?"PLEASE WAIT":label}</Text></TouchableOpacity>;

  return <ScrollView keyboardShouldPersistTaps="handled">
    {screen==="Community"&&<>
      <View style={styles.card}><Text style={styles.title}>NEXORA Community</Text><Text style={styles.text}>Share updates with members. Posts are saved in the NEXORA database.</Text>{field("YOUR UPDATE",post,setPost,"Write something for the community...",true)}{button("PUBLISH UPDATE",publishPost)}{!!message&&<Text style={styles.note}>{message}</Text>}</View>
      <Text style={styles.title}>Latest updates ({posts.length})</Text>
      {posts.map(p=><View key={p.id} style={styles.card}><Text style={styles.note}>COMMUNITY MEMBER</Text><Text style={styles.text}>{new Date(p.created_at).toLocaleString()}</Text><Text style={[styles.title,{fontSize:16,marginTop:8}]}>{p.body}</Text></View>)}
      {!posts.length&&<Text style={styles.text}>No posts yet.</Text>}
    </>}
    {screen==="Marketplace"&&<>
      <View style={styles.card}><Text style={styles.title}>NEXORA Marketplace</Text><Text style={styles.text}>Publish services, products and digital offers. Checkout and seller payouts are not active yet.</Text>{field("OFFER TITLE",title,setTitle,"What are you offering?")}
      <Text style={styles.label}>CATEGORY</Text><View style={{flexDirection:"row",gap:8}}>{["service","product","digital"].map(c=><TouchableOpacity key={c} onPress={()=>setCategory(c)} style={{padding:9,borderRadius:8,borderWidth:1,borderColor:category===c?C.cyan:C.line}}><Text style={{color:category===c?C.cyan:C.text}}>{c}</Text></TouchableOpacity>)}</View>
      {field("DESCRIPTION",description,setDescription,"Describe your offer...",true)}{field("PRICE (EUR)",price,setPrice,"0.00")}{button("PUBLISH OFFER",publishOffer)}{!!message&&<Text style={styles.note}>{message}</Text>}</View>
      <Text style={styles.title}>Active offers ({offers.length})</Text>
      {offers.map(o=><View key={o.id} style={styles.card}><Text style={styles.note}>{String(o.category).toUpperCase()} · NEXORA SELLER</Text><Text style={[styles.title,{fontSize:17}]}>{o.title}</Text><Text style={styles.text}>{o.description}</Text><Text style={styles.title}>€{Number(o.price).toFixed(2)}</Text></View>)}
      {!offers.length&&<Text style={styles.text}>No offers published yet.</Text>}
    </>}
    {screen==="Business"&&<BusinessStudio signedIn={signedIn}/>}

  </ScrollView>;
}
