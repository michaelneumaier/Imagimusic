import {createTineEnvelope} from './envelope.js';
const COLORS=['#bad6b8','#c8b5dc','#e2bc7d','#91cbd7'];
const PX_PER_M=30e6; // 30 viewBox units / micrometer, identical for every body.
export function createTineResponseView({svg,caption,details,follow,getPlayback}){
 let pcm=null,envelope=null,label='',age=0,state='idle',raf=0,paths=[];
 const cache=new WeakMap();
 function add(tag,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text)el.textContent=text;svg.append(el);return el;}
 function draw(){
  if(!pcm){caption.textContent='Prepare a body to inspect its displacement envelope.';return;}
  const shown=follow.checked?age:0,frame=envelope.frame(shown),length=frame.lengthM/.12*660;
  const band=component=>{const points=frame.points.map(p=>[60+p.u*length,(component===null?p.totalM:p.componentsM[component])*PX_PER_M]);return points.map(([x,a],i)=>`${i?'L':'M'}${x},${120-a}`).join(' ')+points.toReversed().map(([x,a])=>`L${x},${120+a}`).join(' ')+'Z';};
  paths.forEach((path,i)=>path.setAttribute('d',band(i===pcm.count?null:i)));
  const bound=envelope.at(shown,pcm.pickup).totalM*1e6;
  const phase=!follow.checked?'Initial envelope':state==='playing'?'Following playback':state==='ended'?'Audition ended; mechanical envelope shown':'Stopped picture';
  caption.textContent=`${label} · ${phase} at ${shown.toFixed(2)} s. Pickup displacement bound ±${bound.toFixed(3)} µm. The sound reads velocity; this picture bounds displacement.`;
 }
 function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;}
 function tick(){raf=0;const playback=getPlayback();state=playback.state;age=playback.time;draw();if(details.open&&follow.checked&&state==='playing')raf=requestAnimationFrame(tick);}
 function manage(){cancel();draw();if(pcm&&details.open&&follow.checked&&state==='playing')raf=requestAnimationFrame(tick);}
 function select(next,nextLabel){pcm=next;label=nextLabel;age=0;state='idle';envelope=cache.get(pcm);if(!envelope){envelope=createTineEnvelope(pcm.geometry,{count:pcm.count,activation:pcm.activation,impulseNs:pcm.impulseNs});cache.set(pcm,envelope);}
  svg.replaceChildren();paths=[];
  for(const offset of [-60,-30,0,30,60])add('line',{x1:60,x2:740,y1:120+offset,y2:120+offset,stroke:'#536369','stroke-opacity':offset===0?.8:.25});
  add('rect',{x:35,y:25,width:25,height:190,fill:'#64716d'});
  for(let i=0;i<pcm.count;i++)paths.push(add('path',{fill:COLORS[i],'fill-opacity':.13,stroke:COLORS[i],'stroke-opacity':.65,'stroke-width':1.5}));
  paths.push(add('path',{fill:'none',stroke:'#e8eee2','stroke-width':1.5}));
  const length=pcm.geometry.lengthM/.12*660;
  for(const [u,color,dash] of [[pcm.activation,'#e2b777','6 4'],[pcm.pickup,'#90ccd8','none']])add('line',{x1:60+u*length,x2:60+u*length,y1:20,y2:220,stroke:color,'stroke-width':dash==='none'?1.5:4,'stroke-dasharray':dash});
  add('text',{x:75,y:245,fill:'#dce5de','font-size':17},'Fixed scales · horizontal envelope guides 1 µm apart');
  svg.setAttribute('aria-label',`Displacement envelope bands for ${label}. Four modal bounds and their sum, not instantaneous bending.`);manage();
 }
 function sync(nextState,time){state=nextState;if(pcm)age=nextState==='preparing'?0:time;manage();}
 const changed=()=>{const playback=getPlayback();state=playback.state;if(pcm&&state==='playing')age=playback.time;manage();};
 details.addEventListener('toggle',changed);follow.addEventListener('change',changed);
 draw();
 return {select,sync,dispose(){cancel();details.removeEventListener('toggle',changed);follow.removeEventListener('change',changed);}};
}
