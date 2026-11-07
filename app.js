const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
let current24 = null;
let history = [];
let backend = localStorage.getItem('goldBackend') || '';
$('backendUrl').value = backend;

function drawChart(points){
  const svg=$('priceChart');
  if(!points || points.length<2){svg.innerHTML='<text x="300" y="95" text-anchor="middle" fill="#96a5b1" font-size="13">Chart appears when price history is available</text>';return;}
  const vals=points.map(p=>Number(p.price));
  const min=Math.min(...vals), max=Math.max(...vals), span=(max-min)||1;
  const coords=vals.map((v,i)=>[20+i*560/(vals.length-1),165-(v-min)/span*135]);
  const line=coords.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
  const area=line+` L 580 175 L 20 175 Z`;
  svg.innerHTML=`<defs><linearGradient id="fillGold" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9bd63" stop-opacity=".28"/><stop offset="1" stop-color="#e9bd63" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#fillGold)"/><path d="${line}" fill="none" stroke="#e9bd63" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function demo(){
  const seed=7250;
  history=Array.from({length:16},(_,i)=>({price:seed+Math.sin(i*.7)*35+i*2.1}));
  $('price24').textContent=fmt(seed);
  $('price22').textContent=fmt(seed*22/24);
  $('change24').textContent='DEMO'; $('change22').textContent='DEMO';
  $('updatedAt').textContent='Illustrative demo';
  $('feedStatus').textContent='Demo mode'; $('feedDot').parentElement.classList.remove('connected');
  $('priceMode').textContent='DEMO';
  drawChart(history);
}
async function loadData(){
  if(!backend){demo();return;}
  $('feedStatus').textContent='Connecting…';
  try{
    const r=await fetch(backend.replace(/\/$/,'')+'/api/dashboard',{cache:'no-store'});
    if(!r.ok) throw new Error('Backend returned '+r.status);
    const d=await r.json();
    if(!d || !d.gold || !Number(d.gold.price_24k_inr_per_gram)) throw new Error('Price data missing');
    current24=Number(d.gold.price_24k_inr_per_gram);
    $('price24').textContent=fmt(current24);
    $('price22').textContent=fmt(current24*22/24);
    $('change24').textContent=d.gold.change_percent==null?'Live':`${Number(d.gold.change_percent)>0?'+':''}${Number(d.gold.change_percent).toFixed(2)}%`;
    $('change24').className='change '+(Number(d.gold.change_percent)>0?'up':Number(d.gold.change_percent)<0?'down':'');
    $('change22').textContent=$('change24').textContent;$('change22').className=$('change24').className;
    $('updatedAt').textContent='Updated '+new Date(d.updated_at||Date.now()).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    $('feedStatus').textContent='Live feed';$('feedDot').parentElement.classList.add('connected');$('priceMode').textContent='LIVE';
    history=d.history||[];drawChart(history);
    if(d.analysis){$('verdict').textContent=d.analysis.verdict||'WAIT';$('confidence').textContent=d.analysis.confidence||'Model assessment';$('analysisTitle').textContent=d.analysis.title||'Market assessment';$('analysisText').textContent=d.analysis.summary||'No summary supplied.';$('factors').innerHTML=(d.analysis.factors||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('');}
    if(Array.isArray(d.news)&&d.news.length){$('newsList').innerHTML=d.news.map(n=>`<article class="news-item"><span class="news-type">${escapeHtml(n.category||'MARKET NEWS')}</span><b>${escapeHtml(n.title||'Market update')}</b><p>${escapeHtml(n.summary||'')}</p>${n.url?`<a href="${safeUrl(n.url)}" target="_blank" rel="noopener">Read source ↗</a>`:''}</article>`).join('');}
    checkAlert();
  }catch(e){$('feedStatus').textContent='Feed unavailable';$('feedDot').parentElement.classList.remove('connected');$('connectionMessage').textContent='Could not load live data: '+e.message+'. Showing demo values instead.';demo();}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeUrl(s){try{const u=new URL(s);return ['https:'].includes(u.protocol)?u.href:'#';}catch{return '#';}}
function checkAlert(){const target=Number(localStorage.getItem('goldTarget'));if(target&&current24&&current24<=target){$('alertMessage').textContent=`Target reached: 24K is ${fmt(current24)} per gram.`;if('Notification'in window&&Notification.permission==='granted')new Notification('Gold price alert',{body:`24K gold is ${fmt(current24)} per gram.`});}}
$('connectBtn').addEventListener('click',async()=>{const v=$('backendUrl').value.trim().replace(/\/+$/,'');if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/i.test(v)){$('connectionMessage').textContent='Please enter a valid HTTPS backend address.';return;}backend=v;localStorage.setItem('goldBackend',v);$('connectionMessage').textContent='Testing connection…';await loadData();if($('feedStatus').textContent==='Live feed')$('connectionMessage').textContent='Connected. Live data loaded.';});
$('clearBackend').addEventListener('click',()=>{localStorage.removeItem('goldBackend');backend='';$('backendUrl').value='';$('connectionMessage').textContent='Connection cleared. Showing demo values.';demo();});
$('refreshBtn').addEventListener('click',loadData);
$('saveAlert').addEventListener('click',async()=>{const v=Number($('targetPrice').value);if(!v||v<=0){$('alertMessage').textContent='Enter a valid target price.';return;}localStorage.setItem('goldTarget',String(v));$('alertMessage').textContent=`Alert saved for ₹${v.toLocaleString('en-IN')}/g. Checking while app is open.`;if('Notification'in window&&Notification.permission==='default')await Notification.requestPermission();checkAlert();});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
demo();loadData();setInterval(()=>{if(backend)loadData();},5*60*1000);
