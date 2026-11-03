import {createTineLiveResponse} from './live-response.js';
export function createTineLiveResponseView({details,svg,selector,slider,previous,next,caption,reading,zoom,scale}){
 let original=null,candidate=null;const cache=new WeakMap();
 const selected=()=>selector.value==='candidate'?candidate:original;
 function model(record){if(!cache.has(record))cache.set(record,createTineLiveResponse(record));return cache.get(record);}
 function draw(){
  const record=selected(),available=!!record;slider.disabled=previous.disabled=next.disabled=!available;selector.disabled=!original;
  if(!available){svg.replaceChildren();reading.textContent='Complete or reopen a pass to inspect its bending.';caption.textContent='No completed body is selected.';return;}
  const end=record.fadeStart+Math.round(.025*record.sampleRate);slider.max=end;slider.value=Math.min(end,Number(slider.value));previous.disabled=Number(slider.value)<=0;next.disabled=Number(slider.value)>=end;
  if(!details.open)return;
  const state=model(record).at(Number(slider.value));svg.replaceChildren();
  const add=(tag,attrs,text)=>{const node=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);if(text!==undefined)node.textContent=text;svg.append(node);return node;};
  const magnification=Number(zoom.value);
  const x=meters=>110+5500*meters,y=meters=>150-30e6*magnification*meters;
  scale.textContent=`Shared selected scale: 5.5 drawing units per mm along the body; ${30*magnification} units per µm of displacement (about ${Math.round(30e6*magnification/5500).toLocaleString()}× exaggeration relative to length).`;
  for(const um of [-2,-1,0,1,2]){add('line',{x1:110,x2:780,y1:y(um*1e-6/magnification),y2:y(um*1e-6/magnification),stroke:um===0?'#7d9493':'#35454c','stroke-dasharray':um===0?'none':'4 5'});add('text',{x:9,y:y(um*1e-6/magnification)+4,fill:'#b8c9c7','font-size':24},`${um/magnification} µm`);}
  add('rect',{x:95,y:65,width:15,height:170,fill:'#667c78'});
  add('polyline',{points:state.points.map(p=>`${x(p.xM)},${y(p.displacementM)}`).join(' '),fill:'none',stroke:'#e3d8ac','stroke-width':3});
  add('line',{x1:x(state.lengthM),x2:x(state.lengthM),y1:225,y2:235,stroke:'#b8c9c7'});add('text',{x:x(state.lengthM),y:255,fill:'#b8c9c7','font-size':24,'text-anchor':'end'},`${record.design.lengthMm} mm`);
  add('circle',{cx:x(record.design.pickup*state.lengthM),cy:y(state.pickup.displacementM),r:4,fill:'#90ccd8'});
  const name=selector.value==='candidate'?'Prepared comparison':'Original';
  reading.textContent=`Frame ${state.frame} / ${end} · ${state.seconds.toFixed(6)} seconds · ${name}: ${record.design.lengthMm} × ${record.design.widthMm} mm`;
  caption.textContent=`Signed centerline displacement; blue dot is the pickup. Pickup ${(state.pickup.displacementM*1e6).toPrecision(3)} µm. Combined mechanical energy ${state.totalEnergyJ.toExponential(3)} J.${state.frame>=record.fadeStart?' This frame is in or at the end of the audio fade; the mechanical state is not faded.':''}`;
  if(state.points.some(p=>y(p.displacementM)<0||y(p.displacementM)>280))caption.textContent+=' Some sampled bending extends outside this picture; choose less magnification.';
  svg.setAttribute('aria-label',`${name} tine bending at sample frame ${state.frame}, ${state.seconds.toFixed(6)} seconds. Displacement is exaggerated.`);
 }
 function setSources(source,changed){const fresh=source!==original;original=source;candidate=changed;selector.querySelector('option[value="candidate"]').disabled=!candidate;
  if(fresh){selector.value='original';if(original){slider.max=original.fadeStart+Math.round(.025*original.sampleRate);slider.value=Math.min(original.fadeStart+Math.round(.025*original.sampleRate),(original.events[0]?.frame??0)+Math.round(.0005*original.sampleRate));}}
  if(selector.value==='candidate'&&!candidate)selector.value='original';draw();
 }
 zoom.addEventListener('change',draw);details.addEventListener('toggle',draw);selector.addEventListener('change',draw);slider.addEventListener('input',draw);
 previous.addEventListener('click',()=>{const focused=document.activeElement===previous;slider.value=Math.max(0,Number(slider.value)-1);draw();if(focused&&previous.disabled)slider.focus({preventScroll:true});});next.addEventListener('click',()=>{const focused=document.activeElement===next;slider.value=Math.min(Number(slider.max),Number(slider.value)+1);draw();if(focused&&next.disabled)slider.focus({preventScroll:true});});
 draw();return {setSources};
}
