import {validateInverseTarget} from '../score/grove-inverse.js';
import {composeGrove,groveSystem} from '../score/grove.js';
import {createInverseJobs} from './jobs.js';
import {createCandidateDiagram} from './candidate-diagram.js';
import {readInverseFile} from './read-file.js';
import {keepInverseCandidate,canonicalInverseCandidate} from '../score/grove-inverse-kept.js';
import {createInverseTransport} from './transport.js';
import {createInversePhraseCapture} from './phrase-capture.js';
import {inversePhraseTransportEvents} from '../score/grove-inverse-phrase.js';
import {INVERSE_SHARED_GESTURE_EVENTS as sharedGesture} from '../score/grove-inverse-gesture.js';
const $=id=>document.getElementById(id),jobs=createInverseJobs();
const source=composeGrove({seed:3});source.bodies.forEach(body=>body.mass=.02);
const sourceSystem=groveSystem(source),example=[...sourceSystem.normalFreqsHz.map(f=>Number(f.toFixed(6))),Number(sourceSystem.decayS.toFixed(8))];
let context=null,transport=null,instrument=null,report=null,busy=false,generation=0,armed=false,raf=0;
const candidateButtons=[],bodyButtons=[];
let lastGestureTopology=null;
const phraseCapture=createInversePhraseCapture();
let phraseTopology=null,draftTopology=null;
let lastTouch=null,mountedTopology=null,mountedReport=null,listeningLevel=1,fileRead=null;
let spatial=null,world=null,tap=null,pictureResize=null,pictureFailed=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function restore(){example.slice(0,3).forEach((f,i)=>$('f'+i).value=f);$('decay').value=example[3];$('base').value='48';}
restore();
function state(){return transport?transport.snapshot():{active:0,pending:0,strikes:[]};}
function occupied(snapshot=state()){return snapshot.active+snapshot.pending>0;}
function controls(snapshot=state()){
 expirePhrase(snapshot.time??0);
 const ringing=occupied(snapshot),remembering=phraseCapture.snapshot.active;
 $('open-instrument').disabled=busy||ringing||remembering;
 $('search').disabled=busy||ringing||remembering;$('example').disabled=busy;
 $('cancel').hidden=!busy;
 $('listen').disabled=busy||!instrument||(armed&&context?.state==='running');
 $('listen').textContent=armed&&context?.state==='running'?'Listening enabled':'Start listening';
 candidateButtons.forEach(button=>button.disabled=busy||ringing||remembering);
 bodyButtons.forEach(button=>button.disabled=busy||!instrument||!armed||context?.state!=='running');
 $('hear-gesture').disabled=busy||ringing||remembering||!instrument||!armed||context?.state!=='running';
 const compareGesture=lastGestureTopology&&mountedReport===report&&mountedTopology!==lastGestureTopology&&!$('hear-gesture').disabled;
 $('gesture-comparison').hidden=!compareGesture;
 const comparison=compareGesture?`Try the same gesture on this ${mountedTopology}, too.`:'';
 if($('gesture-comparison').textContent!==comparison)$('gesture-comparison').textContent=comparison;
 $('repeat-touch').disabled=busy||!lastTouch||!instrument||!armed||context?.state!=='running';
 phraseControls(ringing);
 $('ring-count').textContent=ringing?`${snapshot.active} ringing${snapshot.pending?` · ${snapshot.pending} upcoming`:''} / 8 touches`:'Silent';
}
function cancel(message='Preparation cancelled. Previous results and instrument retained.'){
 generation++;fileRead?.abort();fileRead=null;jobs.cancel();busy=false;$('status').textContent=message;controls();
}
$('cancel').onclick=()=>{if(busy)cancel();};
addEventListener('keydown',event=>{if(event.key==='Escape'&&busy){event.preventDefault();cancel();}});
$('listening-level').oninput=()=>{
 const next=Number($('listening-level').value);
 try{transport?.setListeningLevel(next);listeningLevel=next;$('level-label').textContent=next===0?'Muted':next+'×';$('listening-level').setAttribute('aria-valuetext',next===0?'Muted, zero times':next+' times');}
 catch(error){$('listening-level').value=listeningLevel;$('gesture').textContent=error.message;}
};
$('quiet').onclick=()=>{cancelPhrase('New attempt cancelled. Previous completed phrase retained.');transport?.quiet();$('gesture').textContent='Quiet. You can choose another anatomy.';controls();};
$('example').onclick=restore;
$('search-form').onsubmit=async event=>{
 event.preventDefault();if(busy||occupied()||phraseCapture.snapshot.active)return;
 const values=[0,1,2].map(i=>Number($('f'+i).value)),decay=Number($('decay').value);
 const original=values.every((f,i)=>f===example[i])&&decay===example[3];
 const target={version:1,kind:'three-resonance',normalFrequenciesHz:values,decaySeconds:decay,provenance:original?'Known seed 3, equal 0.02 kg masses, rounded declared target':'Visitor-declared frequencies and common decay'};
 try{validateInverseTarget(target);}catch(error){$('status').textContent='The target was refused: '+error.message+' Previous results retained.';return;}
 const token=++generation,started=performance.now();busy=true;controls();$('status').textContent='Searching two possible layouts. You can cancel while it works…';
 try{
  const next=await jobs.run({kind:'search',target,options:{baseMidi:Number($('base').value),seed:19,budget:{restarts:6,iterations:300,maxEvaluations:60000}}});
  if(token!==generation)return;report=next;lastTouch=null;lastGestureTopology=null;clearPhrase();repeatInvitation();renderResults();$('results-section').scrollIntoView({block:'start'});
  $('status').textContent=`${next.candidates.filter(c=>c.status==='accepted').length} layouts within tolerance. ${next.work.evaluations.toLocaleString()} evaluations in ${((performance.now()-started)/1000).toFixed(1)} s. ${next.bound.impossibleWithinTolerance?'This target exceeds the equal-mass family’s frequency-ratio bound, even with tolerance.':next.work.exhausted?next.verdict:'This bounded search does not establish uniqueness or a global optimum.'}`;
 }catch(error){if(token===generation)$('status').textContent=`Search did not finish: ${error.message} Previous results retained.`;}
 finally{if(token===generation){busy=false;controls();}}
};

$('open-instrument').onchange=()=>{const file=$('open-instrument').files[0];$('open-instrument').value='';if(file)openInstrument(file);};
async function openInstrument(file){
 if(busy||occupied()||phraseCapture.snapshot.active)return;
 const token=++generation,reader=new AbortController();fileRead=reader;busy=true;controls();$('status').textContent='Checking the kept anatomy…';
 try{
  const input=await readInverseFile(file,{signal:reader.signal});if(token!==generation)return;
  const opened=await jobs.run({kind:'reopen',text:input.text});if(token!==generation)return;
  const candidate={...opened.candidate,status:opened.candidate.status==='within-tolerance'?'accepted':'saved-outside-tolerance'};
  report={target:opened.record.target,tolerance:opened.record.tolerance,candidates:[candidate],savedRecord:opened.record};
  lastTouch=null;lastGestureTopology=null;clearPhrase();repeatInvitation();renderResults();$('results-section').scrollIntoView({block:'start'});
  $('status').textContent=`Opened ${input.name}. Fit recalculated from the saved instrument and target. Prepare it when you are ready to play. Any previously prepared instrument is retained.`;
 }catch(error){if(token===generation)$('status').textContent=`Could not open the anatomy: ${error.message} Previous results and instrument retained.`;}
 finally{if(token===generation){fileRead=null;busy=false;controls();}}
}
function keepCandidate(index){
 try{
  const record=report.savedRecord??keepInverseCandidate(report,index,{at:new Date().toISOString()});
  const url=URL.createObjectURL(new Blob([canonicalInverseCandidate(record)],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download=`imagimusic-inverse-${record.grove.topology}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  $('status').textContent='The anatomy file is ready to keep. It holds the instrument and target, without your played touches.';
 }catch(error){$('status').textContent=`Could not keep the anatomy: ${error.message}`;}
}

function renderResults(){
 $('results-section').hidden=false;$('results').replaceChildren();candidateButtons.length=0;
 $('target-snapshot').textContent=`${report.savedRecord?'Kept instrument for':'Results for'} ${report.target.normalFrequenciesHz.map(f=>f.toFixed(4)).join(' / ')} Hz; decay ${report.target.decaySeconds.toFixed(4)} s. ${report.target.provenance}. Tolerance: ±${report.tolerance.cents} cents; ${100*report.tolerance.decayRelative}% decay. Input edits do not change these results until you search again.`;
 for(const [index,candidate] of report.candidates.entries()){
  const card=document.createElement('article');card.className='candidate';
  const title=document.createElement('h3');title.textContent=candidate.topology;card.append(title);
  const fit=document.createElement('p');fit.textContent=candidate.status==='accepted'?'Within the declared tolerance':candidate.status==='impossible-in-family'?'Outside tolerance · target impossible in this family':candidate.status==='best-outside-tolerance'?'Best found · outside tolerance':candidate.status==='saved-outside-tolerance'?'Kept instrument · outside tolerance':'No admitted candidate found';card.append(fit);
  if(candidate.grove){
   card.append(createCandidateDiagram(candidate.grove));
   if(report.savedRecord){const origin=document.createElement('p');const discovery=report.savedRecord.discovery;origin.textContent=`Kept instrument. Declared discovery: seed ${discovery.seed}, ${discovery.evaluations.toLocaleString()} evaluations. Fit above is recalculated.`;card.append(origin);}
   const residual=document.createElement('p');residual.textContent=`Largest resonance error: ${candidate.residual.maxAbsCents.toFixed(4)} cents. Decay error: ${(100*Math.abs(candidate.residual.decayRelative)).toFixed(4)}%.`;card.append(residual);
   const achieved=document.createElement('p');achieved.textContent=`Resonances: ${candidate.residual.achieved.normalFrequenciesHz.map(f=>f.toFixed(3)).join(' / ')} Hz.`;card.append(achieved);
   const button=document.createElement('button');button.textContent=report.savedRecord?'Prepare kept anatomy':candidate.status==='accepted'?'Prepare this anatomy':'Explore this near miss';button.onclick=()=>prepare(candidate,card);
   const keep=document.createElement('button');keep.textContent='Keep this anatomy';keep.className='keep-anatomy';keep.onclick=()=>keepCandidate(index);
   const actions=document.createElement('div');actions.className='actions';actions.append(button,keep);card.append(actions);candidateButtons.push(button,keep);
  }
  $('results').append(card);
 }
}
async function prepare(candidate,card){
 if(busy||occupied()||phraseCapture.snapshot.active)return;
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
  $('gesture').textContent='Choose Start listening, then touch a body or hear the shared gesture.';
  $('shared-gesture-help').textContent=`Body 2, then bodies 1 and 3 together. The same three touches on every anatomy. About ${Math.ceil(instrument.duration+.5)} seconds to settle, or choose Quiet.`;
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
$('hear-gesture').onclick=()=>{
 if(phraseCapture.snapshot.active||busy||!instrument||!armed||context?.state!=='running')return;
 try{transport.playGesture(sharedGesture);if(mountedReport===report)lastGestureTopology=mountedTopology;$('gesture').textContent='Body 2, then bodies 1 and 3 together. You can answer with a touch of your own, or choose Quiet.';}
 catch(error){$('gesture').textContent=error.message;}controls();
};
$('repeat-touch').onclick=()=>{if(lastTouch)strike(lastTouch.body);};
function strike(body){
 if(!armed||busy)return;
 const expired=expirePhrase(context.currentTime);
 try{
  const receipt=transport.strikeWithReceipt(body);
  if(receipt&&mountedReport===report){lastTouch={body,topology:mountedTopology};repeatInvitation();}
  let remembered=null;
  if(receipt&&phraseCapture.snapshot.active){remembered=phraseCapture.admit(receipt);if(remembered.finished)completePhrase(remembered.reason==='touch-limit'?'Eight touches reached.':'Eight-second window finished.');}
  $('gesture').textContent=receipt?`Touched body ${body+1}. Left pickup: ${body+1} → 1; right pickup: ${body+1} → 3.`:'Eight touches are ringing or upcoming. This touch was ignored; wait or choose Quiet.';
  if(receipt&&(expired||remembered?.captured===false))$('gesture').textContent+=' This touch played after the phrase window and was not remembered.';
 }catch(error){$('gesture').textContent=error.message;}controls();
}
function phraseText(id,text){if($(id).textContent!==text)$(id).textContent=text;}
function completePhrase(reason){
 phraseTopology=draftTopology;draftTopology=null;
 const count=phraseCapture.snapshot.phrase.events.length;
 phraseText('phrase-status',`${reason} Remembered ${count} ${count===1?'touch':'touches'}. Let the sound finish or choose Quiet before replaying.`);
}
function expirePhrase(time){
 if(phraseCapture.expire(time)){completePhrase('Eight-second window finished.');return true;}
 return false;
}
function cancelPhrase(message){
 if(!phraseCapture.snapshot.active)return;
 phraseCapture.cancel();draftTopology=null;
 phraseText('phrase-status',phraseCapture.snapshot.phrase?message:'New attempt cancelled. No phrase remembered yet.');
}
function clearPhrase(){phraseCapture.clear();phraseTopology=null;draftTopology=null;phraseText('phrase-status','Prepare an anatomy and start listening to begin.');}
function phraseControls(ringing){
 const capture=phraseCapture.snapshot,ready=!busy&&!!instrument&&armed&&context?.state==='running';
 $('remember-phrase').disabled=!ready||ringing||capture.active||mountedReport!==report;
 $('remember-phrase').textContent=capture.phrase?'Remember a new phrase':'Remember a phrase';
 $('finish-phrase').hidden=!capture.active;
 $('replay-phrase').disabled=!ready||ringing||capture.active||!capture.phrase;
 if(capture.active)phraseText('phrase-status',capture.count?`Remembering ${capture.count} / 8 touches. Choose Done, or keep playing within the eight-second window.`:'Ready to remember. Touch a body to begin the eight-second window.');
 $('phrase-summary').hidden=!capture.phrase;
 if(capture.phrase){
  const phrase=capture.phrase,sequence=phrase.events.map(event=>event.body+1).join(' → ');
  const comparison=ready&&!ringing&&!capture.active&&mountedTopology!==phraseTopology?` Try your phrase on this ${mountedTopology}, too.`:'';
  phraseText('phrase-summary',`${phrase.events.length} ${phrase.events.length===1?'touch':'touches'} from the ${phraseTopology}: ${sequence}. First to last touch: ${phrase.spanSeconds.toFixed(2)} s.${comparison}`);
 }else phraseText('phrase-summary','');
}
$('remember-phrase').onclick=()=>{
 if(busy||occupied()||phraseCapture.snapshot.active||!instrument||!armed||context?.state!=='running'||mountedReport!==report)return;
 try{phraseCapture.begin({sampleRate:context.sampleRate,capturedAt:new Date().toISOString()});draftTopology=mountedTopology;controls();}
 catch(error){phraseText('phrase-status',error.message);}
};
$('finish-phrase').onclick=()=>{
 if(!phraseCapture.snapshot.active)return;
 const result=phraseCapture.finish();
 if(result.changed)completePhrase('Phrase finished.');
 else{draftTopology=null;phraseText('phrase-status',result.phrase?'No new touches. Previous phrase retained.':'No touches to remember yet.');}
 controls();
};
$('replay-phrase').onclick=()=>{
 const phrase=phraseCapture.snapshot.phrase;
 if(!phrase||phraseCapture.snapshot.active||busy||!instrument||!armed||context?.state!=='running')return;
 try{transport.playGesture(inversePhraseTransportEvents(phrase));phraseText('phrase-status',`Your phrase started on the ${mountedTopology}. Its touches and timing are unchanged. You can answer with your own touch.`);}
 catch(error){phraseText('phrase-status',error.message);}controls();
};

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
 cancelPhrase('New attempt cancelled while leaving. Previous completed phrase retained.');
 tap?.cancel();
 const wasBusy=busy;cancel(wasBusy?'Preparation cancelled while leaving the page.':'Listening paused while away. Prepared instrument and results retained.');
 transport?.quiet();armed=false;context?.suspend();
 $('gesture').textContent=instrument?'Quiet. Choose Start listening before touching a body again.':'Search, then choose an anatomy to prepare it.';
 cancelAnimationFrame(raf);
});
addEventListener('pageshow',()=>{cancelAnimationFrame(raf);tick();});
tick();
