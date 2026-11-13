const token=process.env.GUMROAD_ACCESS_TOKEN;
const pingUrl=process.env.GUMROAD_PING_URL;
if(!token||!pingUrl) {
  console.error("Set GUMROAD_ACCESS_TOKEN and GUMROAD_PING_URL in the private server environment.");
  process.exit(1);
}
const url=new URL(pingUrl);
if(url.protocol!=="https:"||url.hostname!=="nexora-payment-integrity-api.onrender.com"||!url.pathname.endsWith("/v1/payments/gumroad-ping")||!url.searchParams.get("secret")) {
  console.error("GUMROAD_PING_URL must be the HTTPS NEXORA webhook URL including its random secret query parameter.");
  process.exit(1);
}
const events=["sale","refund","dispute","dispute_won"];
async function api(path,options={}) {
  const response=await fetch("https://api.gumroad.com/v2/"+path,{
    ...options,
    headers:{Authorization:"Bearer "+token,Accept:"application/json",...(options.body?{"Content-Type":"application/x-www-form-urlencoded"}:{}),...(options.headers||{})}
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.success!==true) throw new Error("Gumroad API request failed for "+path+": "+(data.message||response.status));
  return data;
}
for(const event of events) {
  const listed=await api("resource_subscriptions?resource_name="+encodeURIComponent(event));
  const existing=Array.isArray(listed.resource_subscriptions)?listed.resource_subscriptions:[];
  if(existing.some(item=>item.post_url===pingUrl)) {
    console.log("Already configured:",event);
    continue;
  }
  const body=new URLSearchParams({resource_name:event,post_url:pingUrl});
  await api("resource_subscriptions",{method:"PUT",body});
  console.log("Configured:",event);
}
console.log("Gumroad sale, refund, dispute and dispute_won notifications are configured.");
