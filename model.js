'use strict';
const NB=(()=>{
 const missions=[
  {name:'First contact',sector:'Kestrel / public subnet',difficulty:'Initiate',brief:'A forgotten research subnet holds a stolen identity key. Get through its outer relays, recover the key, and return to your entry point.',payload:'Identity key',cost:8,mechanic:'Learn connected routes and signal alignment.',dynamic:false},
  {name:'Glass house',sector:'Helix / financial archive',difficulty:'Operator',brief:'The archive trusts clean packets. Its fast southern route is noisy; the northern cache can scrub your trail. Recover the ledger without reaching 100% trace.',payload:'Shadow ledger',cost:11,mechanic:'Validate packet checksums and choose your route.',dynamic:false},
  {name:'Black current',sector:'Vanta / surveillance grid',difficulty:'Specialist',brief:'A surveillance grid keeps a copy of every citizen. Break the vault’s logic lock and carry the watchlist out before the network isolates you.',payload:'Watchlist',cost:14,mechanic:'Solve a larger logic lock under a tighter trace budget.',dynamic:false},
  {name:'False horizon',sector:'Aster / mirror network',difficulty:'Expert',brief:'The obvious uplink is a decoy. The real vault is behind the lower bridge. Trace costs are high: reserve your cloak and consider the scrub cache.',payload:'Mirror seed',cost:17,mechanic:'Read the topology: the upper uplink cannot reach the vault.',dynamic:false},
  {name:'Dead switch',sector:'NULL / adaptive core',difficulty:'Ghost',brief:'This network rewires itself after your third breach. The central vault link will close and an emergency lower route will open. Keep an exit in mind.',payload:'Core fragment',cost:18,mechanic:'Adapt to a topology change after three successful breaches.',dynamic:true}
 ];
 const nodes=[
  {id:'entry',name:'Entry point',type:'entry',x:11,y:50,noise:0},
  {id:'relay',name:'Relay 01',type:'circuit',x:29,y:25,noise:0},
  {id:'firewall',name:'Firewall',type:'packets',x:29,y:75,noise:7},
  {id:'cache',name:'Scrub cache',type:'circuit',x:49,y:19,noise:0},
  {id:'bridge',name:'Bridge 04',type:'packets',x:49,y:81,noise:3},
  {id:'hub',name:'Switchboard',type:'logic',x:64,y:50,noise:6},
  {id:'uplink',name:'Uplink 07',type:'packets',x:73,y:16,noise:0},
  {id:'backup',name:'Emergency relay',type:'circuit',x:73,y:84,noise:2},
  {id:'vault',name:'Data vault',type:'logic',x:89,y:50,noise:4}
 ];
 function edges(m,breaches){let e=[['entry','relay'],['entry','firewall'],['relay','cache'],['firewall','bridge'],['cache','hub'],['bridge','hub'],['hub','vault'],['cache','uplink'],['bridge','backup'],['backup','vault']];if(m!==3)e.push(['uplink','vault']);if(m===4&&breaches<3)e=e.filter(p=>!(p[0]==='backup'&&p[1]==='vault'));if(m===4&&breaches>=3)e=e.filter(p=>!(p[0]==='hub'&&p[1]==='vault'));return e;}
 const connected=(m,b,a,c)=>edges(m,b).some(e=>e.includes(a)&&e.includes(c));
 const fresh=m=>({mission:m,current:'entry',selected:'relay',owned:['entry'],trace:0,cloak:1,breaches:0,payload:false,status:'active',moves:0,logs:['Tunnel established. You are at the entry point.'],boards:{}});
 function log(s,t){s.logs.push(t);s.logs=s.logs.slice(-8);}
 function noise(s,n){s.trace=Math.min(100,Math.max(0,s.trace+n));if(s.trace>=100){s.status='failed';log(s,'TRACE COMPLETE. Your tunnel has been isolated.');}}
 function move(s,id){if(s.status!=='active')return false;if(!s.owned.includes(id)||id===s.current||!connected(s.mission,s.breaches,s.current,id))return false;noise(s,2);if(s.status!=='active')return false;s.current=id;s.selected=id;s.moves++;log(s,'Moved to '+nodes.find(n=>n.id===id).name+'. Trace +2.');return true;}
 function cost(s,id){return missions[s.mission].cost+nodes.find(n=>n.id===id).noise;}
 function breach(s,id,force=false){if(s.status!=='active'||s.owned.includes(id)||!connected(s.mission,s.breaches,s.current,id))return false;noise(s,cost(s,id)+(force?18:0));if(s.status!=='active')return false;s.owned.push(id);s.current=id;s.selected=id;s.breaches++;s.moves++;log(s,nodes.find(n=>n.id===id).name+' secured.');if(id==='cache'){noise(s,-18);log(s,'Scrub cache removed 18% trace.');}if(missions[s.mission].dynamic&&s.breaches===3)log(s,'TOPOLOGY SHIFT: central vault link closed; emergency relay link opened.');return true;}
 function collect(s){if(s.status!=='active'||s.current!=='vault'||s.payload)return false;noise(s,8);if(s.status!=='active')return false;s.payload=true;log(s,'Payload secured. Return to the entry point and extract.');return true;}
 function extract(s){if(s.status!=='active'||!s.payload||s.current!=='entry')return false;s.status='complete';log(s,'Extraction complete. Tunnel closed.');return true;}
 function cloak(s){if(s.status!=='active'||!s.cloak)return false;s.cloak=0;noise(s,-25);log(s,'Cloak deployed. Trace reduced by 25%.');return true;}
 function circuit(seed){return {type:'circuit',rot:[1,0,3,2,1,2,0,1,2].map((n,i)=>(n+seed+i%2)%4),kind:['elbow','straight','elbow','elbow','elbow','elbow','straight','elbow','straight']};}
 function ports(kind,r){const base=kind==='straight'?[0,2]:[0,1];return base.map(n=>(n+r)%4);}
 function circuitOK(p){let cell=3,incoming=3;const seen=new Set();while(!seen.has(cell)){seen.add(cell);const exits=ports(p.kind[cell],p.rot[cell]);if(!exits.includes(incoming))return false;const out=exits.find(d=>d!==incoming);if(cell===5&&out===1)return true;const row=Math.floor(cell/3),col=cell%3,dr=[-1,0,1,0],dc=[0,1,0,-1],nr=row+dr[out],nc=col+dc[out];if(nr<0||nr>2||nc<0||nc>2)return false;cell=nr*3+nc;incoming=(out+2)%4;}return false;}
 function packets(seed,m){const n=m>=2?5:4;const cards=Array.from({length:n},(_,i)=>({id:'p'+i,seq:i+1,data:(seed*3+i*7)%26+1,sum:((i+1)+(seed*3+i*7)%26+1)%10}));cards.push({id:'decoy',seq:2,data:8,sum:5});return {type:'packets',cards:cards.sort((a,b)=>((a.seq*7+seed)%11)-((b.seq*7+seed)%11)),chosen:[],count:n};}
 function packetsOK(p){if(p.chosen.length!==p.count)return false;return p.chosen.every((id,i)=>{const c=p.cards.find(c=>c.id===id);return c&&c.seq===i+1&&c.sum===(c.seq+c.data)%10;});}
 function logic(seed,m){const n=m>=2?6:4,target=Array.from({length:n},(_,i)=>(seed+i*3+(i>2?1:0))%2);return {type:'logic',bits:Array(n).fill(0),parities:target.slice(1).map((v,i)=>v^target[i]),anchor:target[0]};}
 function logicOK(p){return p.bits[0]===p.anchor&&p.parities.every((v,i)=>(p.bits[i]^p.bits[i+1])===v);}
 function board(s,id){if(!s.boards[id]){const n=nodes.find(n=>n.id===id),seed=nodes.indexOf(n)+s.mission;s.boards[id]=n.type==='circuit'?circuit(seed):n.type==='packets'?packets(seed,s.mission):logic(seed,s.mission);}return s.boards[id];}
 function solved(p){return p.type==='circuit'?circuitOK(p):p.type==='packets'?packetsOK(p):logicOK(p);}
 return {missions,nodes,edges,connected,fresh,move,cost,breach,collect,extract,cloak,noise,log,board,ports,solved,circuitOK};
})();
if(typeof module!=='undefined')module.exports=NB;
