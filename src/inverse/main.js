import {validateInverseTarget} from '../score/grove-inverse.js';
import {composeGrove,groveSystem} from '../score/grove.js';
import {createInverseJobs} from './jobs.js';
import {createInverseTransport} from './transport.js';
const $=id=>document.getElementById(id),jobs=createInverseJobs();
const source=composeGrove({seed:3});source.bodies.forEach(body=>body.mass=.02);
const sourceSystem=groveSystem(source),example=[...sourceSystem.normalFreqsHz.map(f=>Number(f.toFixed(6))),Number(sourceSystem.decayS.toFixed(8))];
let context=null,transport=null,instrument=null,report=null,busy=false,generation=0,armed=false,raf=0;
const candidateButtons=[],bodyButtons=[];
let lastTouch=null,mountedTopology=null,mountedReport=null,listeningLevel=1;
let spatial=null,world=null,tap=null,pictureResize=null,pictureFailed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function restore(){example.slice(0,3).forEach((f,i)=>$('f'+i).value=f);$('decay').value=example[3];$('base').value='48';}
restore();
function state(){return transport?transport.snapshot():{active:0,strikes:[]};}
function controls(snapshot=state()){
 const ringing=snapshot.active>0;
 $('search').disabled=busy||ringing;$('example').disabled=busy;
 $('cancel').hidden=!busy;
 $('listen').disabled=busy||!instrument||(armed&&context?.state==='running');
 $('listen').textContent=armed&&context?.state==='running'?'Listening enabled':'Start listening';
 candidateButtons.forEach(button=>button.disabled=busy||ringing);
 bodyButtons.forEach(button=>button.disabled=busy||!instrument||!armed||context?.state!=='running');
 $('repeat-touch').disabled=busy||!lastTouch||!instrument||!armed||context?.state!=='running';
 $('ring-count').textContent=ringing?`${snapshot.active} / 8 strikes ringing`:'Silent';
}
function cancel(message='Preparation cancelled. Previous results and instrument retained.'){
 generation++;jobs.cancel();busy=false;$('status').textContent=message;controls();
}
$('cancel').onclick=()=>{if(busy)cancel();};
addEventListener('keydown',event=>{if(event.key==='Escape'&&busy){event.preventDefault();cancel();}});
$('listening-level').oninput=()=>{
 const next=Number($('listening-level').value);
 try{transport?.setListeningLevel(next);listeningLevel=next;$('level-label').textContent=next===0?'Muted':next+'×';$('listening-level').setAttribute('aria-valuetext',next===0?'Muted, zero times':next+' times');}
 catch(error){$('listening-level').value=listeningLevel;$('gesture').textContent=error.message;}
};
$('quiet').onclick=()=>{transport?.quiet();$('gesture').textContent='Quiet. You can choose another anatomy.';controls();};
$('example').onclick=restore;
$('search-form').onsubmit=async event=>{
 event.preventDefault();if(busy||state().active)return;
 const values=[0,1,2].map(i=>Number($('f'+i).value)),decay=Number($('decay').value);
 const original=values.every((f,i)=>f===example[i])&&decay===example[3];
 const target={version:1,kind:'three-resonance',normalFrequenciesHz:values,decaySeconds:decay,provenance:original?'Known seed 3, equal 0.02 kg masses, rounded declared target':'Visitor-declared frequencies and common decay'};
 try{validateInverseTarget(target);}catch(error){$('status').textContent='The target was refused: '+error.message+' Previous results retained.';return;}
 const token=++generation,started=performance.now();busy=true;controls();$('status').textContent='Searching two possible layouts. You can cancel while it works…';
 try{
  const next=await jobs.run({kind:'search',target,options:{baseMidi:Number($('base').value),seed:19,budget:{restarts:6,iterations:300,maxEvaluations:60000}}});
  if(token!==generation)return;report=next;lastTouch=null;repeatInvitation();renderResults();$('results-section').scrollIntoView({block:'start'});
  $('status').textContent=`${next.candidates.filter(c=>c.status==='accepted').length} layouts within tolerance. ${next.work.evaluations.toLocaleString()} evaluations in ${((performance.now()-started)/1000).toFixed(1)} s. ${next.bound.impossibleWithinTolerance?'This target exceeds the equal-mass family’s frequency-ratio bound, even with tolerance.':next.work.exhausted?next.verdict:'This bounded search does not establish uniqueness or a global optimum.'}`;
 }catch(error){if(token===generation)$('status').textContent=`Search did not finish: ${error.message} Previous results retained.`;}
 finally{if(token===generation){busy=false;controls();}}
};
function renderResults(){
 $('results-section').hidden=false;$('results').replaceChildren();candidateButtons.length=0;
 $('target-snapshot').textContent=`Results for ${report.target.normalFrequenciesHz.map(f=>f.toFixed(4)).join(' / ')} Hz; decay ${report.target.decaySeconds.toFixed(4)} s. ${report.target.provenance}. Input edits do not change these results until you search again.`;
 for(const candidate of report.candidates){
  const card=document.createElement('article');card.className='candidate';
  const title=document.createElement('h3');title.textContent=candidate.topology;card.append(title);
  const fit=document.createElement('p');fit.textContent=candidate.status==='accepted'?'Within the declared tolerance':candidate.status==='impossible-in-family'?'Outside tolerance · target impossible in this family':candidate.status==='best-outside-tolerance'?'Best found · outside tolerance':'No admitted candidate found';card.append(fit);
  if(candidate.grove){
   const residual=document.createElement('p');residual.textContent=`Largest resonance error: ${candidate.residual.maxAbsCents.toFixed(4)} cents. Decay error: ${(100*Math.abs(candidate.residual.decayRelative)).toFixed(4)}%.`;card.append(residual);
   const achieved=document.createElement('p');achieved.textContent=`Found: ${candidate.residual.achieved.normalFrequenciesHz.map(f=>f.toFixed(3)).join(' / ')} Hz.`;card.append(achieved);
   const button=document.createElement('button');button.textContent=candidate.status==='accepted'?'Prepare this anatomy':'Explore this near miss';button.onclick=()=>prepare(candidate,card);card.append(button);candidateButtons.push(button);
  }
  $('results').append(card);
 }
}
async function prepare(candidate,card){
 if(busy||state().active)return;
 const token=++generation,started=performance.now();busy=true;controls();$('status').textContent=`Preparing the ${candidate.topology} at your audio context’s sample rate…`;
 try{
  if(!context){context=new AudioContext();transport=createInverseTransport(context);transport.setListeningLevel(listeningLevel);context.onstatechange=()=>controls();}
  const prepared=await jobs.run({kind:'candidate',grove:candidate.grove,sampleRate:context.sampleRate});
  if(token!==generation)return;
  await ensureSpatial();
  if(token!==generation)return;
  // Give the synchronous picture preflight real dimensions; roll back on a failed first mount.
  document.querySelector('.playing').hidden=false;document.querySelector('.workshop').classList.add('has-instrument');
  const next=spatial&&!pictureFailed?spatial.mount(prepared,transport):transport.mount(prepared);instrument=next;mountedTopology=candidate.topology;mountedReport=report;armed=false;repeatInvitation();
  if(spatial&&!pictureFailed){configureViews();document.querySelector('.playing').classList.add('spatial-ready');}
  document.querySelectorAll('.candidate').forEach(el=>el.classList.remove('selected'));card.classList.add('selected');drawBodies();
  $('identity').textContent=`${candidate.topology[0].toUpperCase()+candidate.topology.slice(1)} · ${candidate.status==='accepted'?'within tolerance':'outside tolerance'} · ${context.sampleRate.toLocaleString()} Hz playback. Pickups: left body 1, right body 3. Prepared resonances: ${instrument.normalFrequenciesHz.map(f=>f.toFixed(3)).join(' / ')} Hz; decay ${instrument.decaySeconds.toFixed(4)} s.`;
  $('status').textContent=`${candidate.topology} prepared silently in ${((performance.now()-started)/1000).toFixed(1)} s, including buffer validation. Largest resonance error ${candidate.residual.maxAbsCents.toFixed(4)} cents.`;
  $('gesture').textContent='Choose Start listening, then touch a body.';
  $('playing-title').focus({preventScroll:true});document.querySelector('.playing').scrollIntoView({block:'start'});
 }catch(error){
  if(!instrument){document.querySelector('.playing').hidden=true;document.querySelector('.workshop').classList.remove('has-instrument');}
  if(token===generation)$('status').textContent=`Preparation failed: ${error.message} Previous instrument retained.`;
 }
 finally{if(token===generation){busy=false;controls();}}
}
$('listen').onclick=async()=>{
 if(busy||!instrument)return;
 const token=generation;
 try{await context.resume();if(token!==generation)return;armed=context.state==='running';$('gesture').textContent=context.state==='running'?'Touch a body. Let its response unfold.':'Listening is still suspended. Choose Start listening to retry.';}
 catch(error){if(token!==generation)return;$('gesture').textContent='Could not start listening: '+error.message;}
 controls();
};
function repeatInvitation(){
 $('same-touch').hidden=!lastTouch;
 if(!lastTouch)return;
 $('same-touch-caption').textContent=`Your last touch was body ${lastTouch.body+1} on the ${lastTouch.topology}. Try that numbered body on the prepared anatomy. Each touch uses the same impulse; listen for what changes.`;
 $('repeat-touch').textContent=`Touch body ${lastTouch.body+1} again`;
}
$('repeat-touch').onclick=()=>{if(lastTouch)strike(lastTouch.body);};
function strike(body){
 if(!armed||busy)return;
 try{const admitted=transport.strike(body);if(admitted&&mountedReport===report){lastTouch={body,topology:mountedTopology};repeatInvitation();}$('gesture').textContent=admitted?`Touched body ${body+1}. Left pickup: ${body+1} → 1; right pickup: ${body+1} → 3.`:'Eight strikes are still ringing. This touch was ignored; wait or choose Quiet.';}
 catch(error){$('gesture').textContent=error.message;}controls();
}
async function ensureSpatial(){
 if(spatial||pictureFailed)return;
 try{
  const [{createGroveWorld},{createInverseSpatialView},{createInversePicker},{bindBodyTap}]=await Promise.all([
   import('../grove/world.js'),import('./spatial-view.js'),import('./picking.js'),import('../grove/body-tap.js')]);
  $('spatial-panel').hidden=false;
  world=createGroveWorld($('anatomy'));world.controls.enabled=false;
  spatial=createInverseSpatialView({world});
  pictureResize=new ResizeObserver(()=>renderPicture(state()));pictureResize.observe($('anatomy'));
  const pick=createInversePicker({canvas:$('anatomy'),camera:world.camera,getScene:()=>spatial.scene});
  tap=bindBodyTap($('anatomy'),{pick,enabled:()=>!busy&&!document.hidden&&!pictureFailed,onTap:target=>{
   if(target.kind==='body'){if(armed&&context?.state==='running')strike(target.body);else $('gesture').textContent='Choose Start listening before touching a body.';}
   else{spatial.scene.setBridgeHighlight(spatial.scene.bridges[target.index].spec);$('connection').textContent=`Connection ${target.a+1}–${target.b+1} · coupling ratio ${target.coupling} (dimensionless). Inspection only; no strike.`;}
  }});
 }catch(error){
  releasePicture();
  $('spatial-panel').hidden=true;$('picture-status').textContent='Spatial picture unavailable. The numbered anatomy remains playable.';
 }
}
function releasePicture(){
 pictureFailed=true;pictureResize?.disconnect();pictureResize=null;document.querySelector('.playing').classList.remove('spatial-ready');
 for(const resource of [tap,spatial,world]){try{resource?.dispose();}catch{}}
 tap=null;spatial=null;world=null;
}
function configureViews(){
 $('spatial-view').replaceChildren();
 const choices=[['playing','Bodies and connections'],['overview','Whole support'],...instrument.grove.bodies.map((_,i)=>['body:'+i,'Body '+(i+1)]),...instrument.grove.bridges.map((edge,i)=>['bridge:'+i,`Connection ${edge.a+1}–${edge.b+1}`])];
 for(const [value,label] of choices){const option=document.createElement('option');option.value=value;option.textContent=label;$('spatial-view').append(option);}
 $('spatial-view').value=spatial.view;
 $('connection').textContent='Tap a connection to inspect what it joins.';viewCaption();
}
function viewCaption(){
 const missing=spatial?.fallback;
 if(missing){$('view-caption').textContent=`This anatomy has no connection ${missing.a+1}–${missing.b+1}. Showing all bodies and connections instead. The camera stays fixed during a response.`;return;}
 $('view-caption').textContent=$('spatial-view').value==='playing'?'All three bodies and their connections. Ornamental supports may be cropped; the camera stays fixed during a response.':$('spatial-view').value==='overview'?'Whole support. The camera stays fixed while the instrument responds.':'Fixed close view. Other bodies or ornamental supports may be outside the picture; all three numbered controls remain below.';
}
$('spatial-view').onchange=()=>{tap?.cancel();spatial?.select($('spatial-view').value);viewCaption();};
function drawBodies(){
 $('empty').hidden=true;$('bodies').replaceChildren();$('bridges').replaceChildren();bodyButtons.length=0;
 const positions=instrument.grove.layout.map(p=>({x:50+p.x*36,y:50+p.z*36}));
 for(const bridge of instrument.grove.bridges){
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');
  for(const [name,value] of Object.entries({x1:positions[bridge.a].x,y1:positions[bridge.a].y,x2:positions[bridge.b].x,y2:positions[bridge.b].y,'stroke-width':1+bridge.coupling/.04*5}))line.setAttribute(name,String(value));
  $('bridges').append(line);
 }
 positions.forEach((p,body)=>{
  const button=document.createElement('button');button.className='body';button.style.left=p.x+'%';button.style.top=p.y+'%';button.textContent=body+1;button.setAttribute('aria-label',`Strike body ${body+1}`);button.onclick=()=>strike(body);$('bodies').append(button);bodyButtons.push(button);
 });
}
function renderPicture(snapshot){
 if(!spatial||pictureFailed)return;
 try{spatial.update(snapshot,{reducedMotion:reduced.matches});}
 catch(error){releasePicture();$('spatial-panel').hidden=true;$('picture-status').textContent='Spatial picture interrupted. The numbered anatomy remains playable.';}
}
function tick(){
 const snapshot=state();controls(snapshot);
 renderPicture(snapshot);
 bodyButtons.forEach((button,body)=>{
  const envelope=snapshot.strikes.reduce((sum,strike)=>sum+strike.envelope[body],0);
  const glow=Math.min(1,envelope*1800);button.style.setProperty('--glow',glow);button.style.setProperty('--scale',reduced.matches?1:1+.14*glow);
 });
 raf=requestAnimationFrame(tick);
}
addEventListener('pagehide',()=>{
 tap?.cancel();
 const wasBusy=busy;cancel(wasBusy?'Preparation cancelled while leaving the page.':'Listening paused while away. Prepared instrument and results retained.');
 transport?.quiet();armed=false;context?.suspend();
 $('gesture').textContent=instrument?'Quiet. Choose Start listening before touching a body again.':'Search, then choose an anatomy to prepare it.';
 cancelAnimationFrame(raf);
});
addEventListener('pageshow',()=>{cancelAnimationFrame(raf);tick();});
tick();
