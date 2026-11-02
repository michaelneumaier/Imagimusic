import {createTouchReturnSession} from '../src/touch/return-session.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
import {createTouchSession} from '../src/touch/session.js';
import {getLoomJourney} from '../src/listen/journeys.js';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
let shown=null,generation=0;
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/touch/history-worker.js',import.meta.url),{type:'module'})});
const session=createTouchReturnSession({jobs,onChange:({state})=>{const busy=state==='preparing';$('file').disabled=$('example').disabled=busy;$('cancel').hidden=!busy;}});
function node(tag,attrs={},text){const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);if(text!==undefined)el.textContent=text;return el;}
function draw(){
 if(!shown)return;const svg=$('plot');for(const group of [...svg.querySelectorAll('g')])group.remove();
 const group=node('g');svg.append(group);const max=Number($('ceiling').value),x=t=>85+1060*t/shown.duration;let clipped=0;
 for(const body of [0,1]){
  const top=45+300*body,base=top+175,y=value=>base-175*Math.min(max,value)/max,color=body?'#d3dca6':'#83cabb';
  group.append(node('text',{x:85,y:top-16,fill:color,'font-size':19},body?'RIGHT BODY':'LEFT BODY'));
  for(let step=0;step<=4;step++){const value=max*step/4,yy=y(value);group.append(node('path',{d:`M85 ${yy}H1145`,stroke:'#ffffff20',fill:'none'}),node('text',{x:74,y:yy+5,fill:'#b7bdc6','font-size':14,'text-anchor':'end'},String(value)));}
  let path='',previous=null;
  for(const point of shown.points){const command=previous?.side==='before'&&point.side==='at'&&previous.time===point.time?'M':previous?'L':'M';path+=`${command}${x(point.time).toFixed(3)} ${y(point.envelope[body]).toFixed(3)} `;
   if(point.envelope[body]>max){clipped++;group.append(node('circle',{cx:x(point.time),cy:top,r:2,fill:'#f1a6a6'}));}previous=point;}
  group.append(node('path',{d:path,fill:'none',stroke:color,'stroke-width':2}));
  for(const event of shown.gestures.filter(e=>e.body===body&&e.withinOutput))group.append(node('path',{d:`M${x(event.time)} ${base+7}v${8+16*event.velocity}`,stroke:color,'stroke-width':2}));
  for(let step=0;step<=4;step++){const time=shown.duration*step/4;group.append(node('text',{x:x(time),y:base+49,fill:'#b7bdc6','font-size':14,'text-anchor':'middle'},`${time.toFixed(2)} s`));}
 }
 $('clipping').textContent=`${clipped} body samples above the chosen ceiling. Gesture marks may overlap; the list below preserves every event.`;
}
async function open(file){const own=++generation;$('status').textContent='Preparing the sampled history…';try{const result=await session.open(file);if(own!==generation)return;shown=result;$('result').hidden=false;$('name').textContent=result.name;
 $('facts').textContent=`${result.duration.toFixed(3)} seconds · ${result.points.length} points · ${result.gestures.length} gestures · ${result.averaged?'fast-beat averaged envelopes':'interfering-mode envelopes'}`;
 $('events').replaceChildren(...result.gestures.map(e=>{const li=document.createElement('li');li.textContent=`frame ${e.frame} · ${e.time.toFixed(6)} s · ${e.body?'right':'left'} · strength ${e.velocity}${e.withinOutput?'':' · outside rendered duration'}`;return li;}));
 $('ending').textContent=result.record.ended?`Saved Quiet at frame ${result.record.ended.frame}, fade ${result.record.ended.fadeFrames} frames.`:'Natural ending, including the model’s finite tail fade.';
 draw();$('status').textContent='History ready. No sound was prepared or played.';
 }catch(error){if(own===generation&&error.name!=='AbortError')$('status').textContent=error.message+(shown?' Previous drawing retained.':'');}}
$('example').onclick=()=>{const s=createTouchSession(getLoomJourney('distant-cousins').settings,8000);s.strike({frame:0,body:0,velocity:.6});s.strike({frame:5704,body:1,velocity:.5});s.finish(32000);open(new File([JSON.stringify(s.snapshot())],'delayed-neighbour.json',{type:'application/json'}));};
$('file').onchange=()=>{const file=$('file').files?.[0];$('file').value='';if(file)open(file);};
$('cancel').onclick=()=>{if(session.state!=='preparing')return;generation++;session.cancel();$('status').textContent='Preparation cancelled.'+(shown?' Previous drawing retained.':'');};
$('ceiling').onchange=draw;
window.addEventListener('pagehide',event=>{generation++;if(event.persisted)session.cancel();else session.dispose();});
