import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_BASE as API } from "./api";
const C={bg:"#08111F",panel:"#111E30",line:"#263A53",text:"#F3F7FC",muted:"#91A4BA",cyan:"#4DE1D2"};
const s={card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:16,padding:16,marginBottom:14},title:{fontSize:20,fontWeight:"800" as const,color:C.text,marginBottom:8},text:{fontSize:13,lineHeight:20,color:C.muted},label:{fontSize:10,fontWeight:"800" as const,color:C.muted,marginTop:12,marginBottom:6},input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.line,borderRadius:9,padding:12,color:C.text},button:{backgroundColor:C.cyan,borderRadius:10,padding:14,alignItems:"center" as const,marginTop:12},buttonText:{fontSize:12,fontWeight:"900" as const,color:C.bg},note:{fontSize:12,color:C.cyan,marginTop:10,lineHeight:18}};
export default function BusinessStudio({signedIn}:{signedIn:boolean}){
 const [tool,setTool]=useState<"planner"|"swot"|"tasks">("planner");
 const [name,setName]=useState("NEXORA");
 const [tagline,setTagline]=useState("");
 const [industry,setIndustry]=useState("");
 const [customer,setCustomer]=useState("");
 const [problem,setProblem]=useState("");
 const [offer,setOffer]=useState("");
 const [budget,setBudget]=useState("0");
 const [days,setDays]=useState("30");
 const [strengths,setStrengths]=useState("");
 const [weaknesses,setWeaknesses]=useState("");
 const [opportunities,setOpportunities]=useState("");
 const [threats,setThreats]=useState("");
 const [plan,setPlan]=useState("");
 const [notes,setNotes]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [aiBusy,setAiBusy]=useState(false);
 const [aiPlan,setAiPlan]=useState("");
 useEffect(()=>{if(!signedIn)return;let active=true;(async()=>{try{const token=await SecureStore.getItemAsync("nexora_session");const r=await fetch(API+"/v1/business/workspace",{headers:{Authorization:"Bearer "+token}});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load workspace");if(!active)return;setName(d.workspace.business_name||"NEXORA");setTagline(d.workspace.tagline||"");setNotes(d.workspace.goals||"");}catch(e){if(active)setMessage(e instanceof Error?e.message:"Could not load saved workspace.");}})();return()=>{active=false;};},[signedIn]);
 const field=(label:string,value:string,set:(v:string)=>void,placeholder:string,multiline=false)=><><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor={C.muted} multiline={multiline} style={[s.input,multiline?{minHeight:82,textAlignVertical:"top" as const}:{}]}/></>;
 const makePlan=()=>{
  const d=Math.max(7,Math.min(365,Number(days)||30));
  const money=Math.max(0,Number(budget.replace(",","."))||0);
  const p=[name.toUpperCase()+" — "+d+" DAY BUSINESS ACTION PLAN","Market: "+(industry||"Define your market"),"Target customer: "+(customer||"Define one customer group"),"Customer problem: "+(problem||"Validate one urgent problem"),"Proposed offer: "+(offer||"Define a clear outcome"),"Starting budget: €"+money.toFixed(2),"","PHASE 1 — VALIDATE (first "+Math.round(d*.2)+" days)","• Identify 5–10 potential customers and interview them online.","• Review 5 competing offers, prices and customer reviews.","• Confirm that the problem is frequent and worth paying to solve.","","PHASE 2 — PACKAGE THE OFFER (to day "+Math.round(d*.45)+")","• Define deliverables, price, turnaround and support boundaries.","• Create one clear offer page and a simple contact process.","• Prepare a sample or demonstration without overspending.","","PHASE 3 — PILOT (to day "+Math.round(d*.75)+")","• Contact qualified prospects and track replies.","• Deliver a small pilot; collect feedback and measure time/cost.","• Refine the offer based on evidence.","","PHASE 4 — IMPROVE (to day "+d+")","• Compare leads, conversion, revenue and delivery cost.","• Keep what works; remove friction; decide whether to scale.","","CORE METRICS","• Customer conversations • Qualified leads • Paid pilots • Revenue • Delivery margin • Satisfaction","","FIRST ACTION: write a one-sentence offer and validate it with five potential customers."].join("\n");
  setPlan(p);setNotes(p);setMessage("Plan prepared from your answers. Review it and save it to your account.");
 };
 const generateWithAI=async()=>{
  if(!signedIn){setMessage("Sign in in Profile before using AI planning.");return;}
  if(!industry.trim()&&!problem.trim()&&!offer.trim()){setMessage("Add an industry, customer problem or offer first.");return;}
  setAiBusy(true);setMessage("");
  try{
   const token=await SecureStore.getItemAsync("nexora_session");
   const r=await fetch(API+"/v1/business/ai-plan",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({business_name:name,industry,customer,problem,offer,budget,duration_days:days})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"AI planning failed");
   setAiPlan(d.plan);setPlan(d.plan);setNotes(d.plan);setMessage("AI business plan generated. Review it and save it to your workspace.");
  }catch(e){setMessage(e instanceof Error?e.message:"AI planning is temporarily unavailable.");}
  finally{setAiBusy(false);}
 };
 const save=async()=>{
  if(!signedIn){setMessage("Sign in in Profile before saving.");return;}
  setBusy(true);
  try{const token=await SecureStore.getItemAsync("nexora_session");const r=await fetch(API+"/v1/business/workspace",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},body:JSON.stringify({business_name:name,tagline,goals:notes||plan})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Save failed");setMessage("Workspace saved to your NEXORA account.");}
  catch(e){setMessage(e instanceof Error?e.message:"Could not save workspace.");}
  finally{setBusy(false);}
 };
 const tabs=[["planner","Business planner"],["swot","SWOT analysis"],["tasks","Action checklist"]] as const;
 return <View>
  <View style={s.card}><Text style={s.note}>NEXORA BUSINESS STUDIO</Text><Text style={s.title}>Turn an idea into an action plan.</Text><Text style={s.text}>A practical workspace for business planning, risk review and execution. Generate a structured draft locally or request an AI-generated plan from the secure NEXORA server.</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:14}}>{tabs.map(([id,label])=><TouchableOpacity key={id} onPress={()=>setTool(id)} style={{padding:9,borderRadius:8,borderWidth:1,borderColor:tool===id?C.cyan:C.line,backgroundColor:tool===id?"#18384A":"transparent"}}><Text style={{color:tool===id?C.cyan:C.text,fontWeight:"700"}}>{label}</Text></TouchableOpacity>)}</View></View>
  {tool==="planner"&&<View style={s.card}><Text style={s.title}>Business plan builder</Text><Text style={s.text}>Fill in what you know. Blank fields are allowed.</Text>{field("PROJECT NAME",name,setName,"Business name")}{field("SHORT POSITIONING",tagline,setTagline,"What do you offer?")}{field("MARKET / INDUSTRY",industry,setIndustry,"e.g. digital services, retail, software")}{field("TARGET CUSTOMER",customer,setCustomer,"Who is most likely to buy?")}{field("CUSTOMER PROBLEM",problem,setProblem,"What problem are you solving?",true)}{field("YOUR OFFER / SOLUTION",offer,setOffer,"What will the customer receive?",true)}{field("STARTING BUDGET (EUR)",budget,setBudget,"0")}{field("PLAN DURATION (DAYS)",days,setDays,"30")}<TouchableOpacity style={s.button} onPress={makePlan}><Text style={s.buttonText}>GENERATE ACTION PLAN</Text></TouchableOpacity>
  <TouchableOpacity disabled={aiBusy} style={[s.button,{backgroundColor:"#6EA8FF"}]} onPress={generateWithAI}><Text style={s.buttonText}>{aiBusy?"AI IS PREPARING YOUR PLAN...":"GENERATE WITH NEXORA AI"}</Text></TouchableOpacity>{!!(aiPlan||plan)&&<View style={{marginTop:16,padding:12,borderWidth:1,borderColor:C.line,borderRadius:10}}><Text style={s.note}>YOUR ACTION PLAN</Text><Text selectable style={[s.text,{color:C.text,lineHeight:22,marginTop:8}]}>{aiPlan||plan}</Text></View>}</View>}
  {tool==="swot"&&<View style={s.card}><Text style={s.title}>SWOT analysis</Text><Text style={s.text}>Identify internal strengths and weaknesses, then external opportunities and threats.</Text>{field("STRENGTHS",strengths,setStrengths,"What advantages do you have?",true)}{field("WEAKNESSES",weaknesses,setWeaknesses,"What is missing or difficult?",true)}{field("OPPORTUNITIES",opportunities,setOpportunities,"What customer or market gap exists?",true)}{field("THREATS",threats,setThreats,"What could block success?",true)}<TouchableOpacity style={s.button} onPress={()=>{const report=["SWOT ANALYSIS — "+name,"STRENGTHS\n"+(strengths||"Not entered"),"WEAKNESSES\n"+(weaknesses||"Not entered"),"OPPORTUNITIES\n"+(opportunities||"Not entered"),"THREATS\n"+(threats||"Not entered"),"NEXT STEP\nTurn the strongest opportunity into a small customer test."].join("\n\n");setPlan(report);setNotes(report);setTool("planner");setMessage("SWOT report prepared. Save it from your workspace.");}}><Text style={s.buttonText}>PREPARE SWOT REPORT</Text></TouchableOpacity></View>}
  {tool==="tasks"&&<View style={s.card}><Text style={s.title}>First execution checklist</Text><Text style={s.text}>A repeatable sequence to move from idea to a first validated offer.</Text>{["Define one target customer and one urgent problem","Write a one-sentence offer and customer outcome","Review five competitors and their prices","Interview five potential customers online","Create a simple offer page and contact method","Run one small pilot and collect feedback","Review leads, conversion, costs and satisfaction"].map((t,i)=><View key={i} style={{paddingVertical:12,borderBottomWidth:1,borderColor:C.line,flexDirection:"row",gap:10}}><Text style={{color:C.cyan,fontWeight:"900"}}>{String(i+1).padStart(2,"0")}</Text><Text style={[s.text,{flex:1,color:C.text}]}>{t}</Text></View>)}</View>}
  <View style={s.card}><Text style={s.title}>My saved workspace</Text><Text style={s.text}>Your project profile and notes are saved to your NEXORA account.</Text>{field("PROJECT NOTES / PLAN",notes,setNotes,"Generate a plan or write your own notes...",true)}<TouchableOpacity disabled={busy} style={s.button} onPress={save}><Text style={s.buttonText}>{busy?"SAVING...":"SAVE WORKSPACE"}</Text></TouchableOpacity>{!!message&&<Text style={s.note}>{message}</Text>}{!signedIn&&<Text style={s.note}>Sign in in Profile to save your work privately.</Text>}</View>
 </View>;
}
