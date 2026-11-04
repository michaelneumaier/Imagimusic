import {createLivingJourneyStudy} from './journey-study.js';
import {createLivingConnectedJourneyStudy} from './connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from './evolving-journey-study.js';
import {createTineStudyPlayer} from '../tine/study-player.js';
import {createLivingJourneyScore} from './journey-score.js';
import {createLivingJourneyView} from './journey-view.js';
import {createLivingJourneyLayout} from './journey-layout.js';
import {createLivingScene} from './scene.js';
import {createLivingJourneyMedia} from './journey-media.js';
import {createLivingJourneyGeneration} from './journey-generation.js';
import {readLivingJourneyReport,LIVING_JOURNEY_REPORT_LIMIT} from './journey-report.js';
import {setupLivingTuningListening} from './tuning-listening.js';
import {createJourneyContinuation} from './journey-continuation.js';
import {setupJourneyListeningView} from './journey-listening-view.js';
import {setupLivingJourneyMovieControls} from './journey-movie-controls.js';
import {createLivingPersonalJourneyStudy} from './personal-journey-study.js';
import {readLivingPersonalJourneyReport} from './personal-journey-report.js';
import {readLivingPersonalPhrase,PERSONAL_PHRASE_INPUT_LIMIT} from './personal-journey-input.js';

const $=id=>document.getElementById(id),audio=$('audio'),player=createTineStudyPlayer({audio});
let film=null;
const media=createLivingJourneyMedia();
const generated=createLivingJourneyGeneration();
const tuning=setupLivingTuningListening({beforePlay:()=>stop()});
setupJourneyListeningView({beforeEnter:()=>{tuning.stop();film?.cancel();}});
let generatedChoice=false,selectedRequest=null,expectedSha256=null,personalSource=null,personalChoice=false;
let plan,url,rows=[],generation=0,starting=false;
let score,marks=[],cursors=[];
let scene=null,journeyView=null,raf=0,lastDraw=-Infinity;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const continuation=createJourneyContinuation({
 state:()=>({hidden:document.hidden,starting,ended:audio.ended,personal:personalChoice}),
 repeat:()=>listen(),fresh:()=>makeFreshJourney(true),onChange:()=>{
 $('journey-continue').checked=continuation.enabled;
 $('journey-continue-label').textContent=personalChoice?'Repeat this journey':'Keep listening after this journey';
 $('journey-continue-note').textContent=personalChoice?(continuation.pending?'A moment of quiet. Your same journey returns in three seconds.':continuation.enabled?'The same personal journey will return after its ending. Quiet stops repetition.':'Optional. Repeat this complete composition after three seconds of quiet. Its music and downloads stay the same. Keeping a file stops repetition.'):continuation.pending?'A moment of quiet. Preparing the next journey starts in three seconds.':continuation.enabled?'Another journey will follow this ending. Quiet stops the sequence.':'Optional. New journeys follow at the selected structure; ideas can repeat. Each new journey replaces the previous downloads. Keeping a file stops the sequence.';
 $('quiet').disabled=audio.paused&&!starting&&!continuation.pending&&!film?.busy;
}});
$('ensemble-motion').checked=!reducedMotion.matches;
function drawEnsemble(){
 if(!scene||!journeyView)return;
 const seconds=Math.min(plan.frames/plan.sampleRate,Math.max(0,audio.currentTime||0));
 scene.instanceFrame(journeyView.at(seconds),$('ensemble-veils').checked);
}
function tick(stamp){raf=0;if(audio.paused||document.hidden||!$('ensemble-motion').checked)return;if(stamp-lastDraw>=1000/30){drawEnsemble();lastDraw=stamp;}raf=requestAnimationFrame(tick);}
function stopAnimation(){cancelAnimationFrame(raf);raf=0;}
function startAnimation(){stopAnimation();lastDraw=-Infinity;if(scene&&!audio.paused&&$('ensemble-motion').checked)raf=requestAnimationFrame(tick);}
function prepareEnsemble(){
 stopAnimation();scene?.dispose();scene=null;journeyView=null;
 try{journeyView=createLivingJourneyView(plan);scene=createLivingScene($('ensemble'),{ensemble:createLivingJourneyLayout(journeyView.allocation,{fitAllInstances:personalChoice})});scene.setLook('dusk');scene.instanceFrame(journeyView.at(0),$('ensemble-veils').checked);$('ensemble-status').textContent=`${journeyView.allocation.instances.length} independent instruments · held camera · sound follows the selected score.`;}
 catch(error){scene?.dispose();scene=null;$('ensemble-status').textContent='The ensemble could not open. Audio and the score diagram remain available.';}
}
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function buildScore(){
 score=createLivingJourneyScore(plan);marks=[];cursors=[];
 const lanes=[95,80,65].map(mm=>{
  const lane=document.createElement('div'),label=document.createElement('span'),track=document.createElement('div');
  lane.className='score-lane';label.className='score-label';label.textContent=`${mm} mm`;track.className='score-track';
  for(const pass of score.passes.filter(p=>p.bodyMm===mm)){
   const bar=document.createElement('span');bar.className='score-pass';bar.style.left=`${100*pass.startFrame/score.frames}%`;bar.style.width=`${100*(pass.endFrame-pass.startFrame)/score.frames}%`;
   for(const touch of pass.touches){const dot=document.createElement('i');dot.style.left=`${100*(touch.frame-pass.startFrame)/(pass.endFrame-pass.startFrame)}%`;bar.append(dot);}
   track.append(bar);marks.push({bar,pass});
  }
  const cursor=document.createElement('span');cursor.className='score-cursor';track.append(cursor);cursors.push(cursor);lane.append(label,track);return lane;
 });
 $('score').replaceChildren(...lanes);
}
function drawScore(frame){
 const position=Math.min(100,Math.max(0,100*frame/score.frames));
 cursors.forEach(cursor=>cursor.style.left=`${position}%`);
 const active=[];
 marks.forEach(({bar,pass})=>{const on=frame>=pass.touches[0].frame&&frame<pass.endFrame;bar.classList.toggle('sounding',on);if(on)active.push(pass);});
 const bodies=[...new Set(active.map(p=>p.bodyMm))];
 const reading=bodies.length?`${bodies.join(' / ')} mm · ${active.length} rendered ${active.length===1?'pass':'passes'} in progress`:'No active touch or tail at this moment.';
 $('score-reading').textContent=reading;
 $('score').setAttribute('aria-label',`Three instrument score lanes at ${clock(frame/score.sampleRate)}. ${reading} Dots mark accepted touches; bars include complete tails. This is a score diagram, not physical motion.`);
}
function update(){
 const frame=Math.round(audio.currentTime*plan.sampleRate);
 drawScore(frame);
 const active=plan.sections.filter(s=>frame>=s.startFrame&&frame<s.endFrame);
 rows.forEach((row,i)=>row.classList.toggle('active',frame>=plan.sections[i].startFrame&&frame<plan.sections[i].endFrame));
 $('quiet').disabled=audio.paused&&!starting&&!continuation.pending&&!film?.busy;
 if(!starting)$('status').textContent=audio.error?'Audio unavailable. See the local rendering instructions below.':audio.ended?'The journey has settled.':`${audio.paused?'Paused':'Playing'} · ${clock(audio.currentTime)} · ${active.map(s=>s.name).join(' / ')||'a moment of space'}`;
}
function stop(){film?.cancel();continuation.stop();generation++;starting=false;media.cancel();generated.cancel();player.stop();update();}
function choose({continueSequence=false}={}){
 tuning.stop();film?.cancel();
 if(!continueSequence)continuation.stop();
 expectedSha256=null;
 generation++;starting=false;player.stop();media.clear();generated.clear();audio.hidden=true;audio.removeAttribute('src');audio.load();
 const shape=document.querySelector('[name=shape]:checked').value,seed=Number($('seed').value);
 personalChoice=$('seed').value==='personal';
 generatedChoice=personalChoice||$('seed').selectedOptions[0]?.dataset.generated==='true';
 for(const input of document.querySelectorAll('[name=shape]'))input.disabled=personalChoice;
 selectedRequest=personalChoice?{kind:'imagimusic-living-personal-journey-request',version:1,source:personalSource}:{kind:'imagimusic-living-journey-request',version:1,seed,treatment:shape};
 const treatment={connected:{make:createLivingConnectedJourneyStudy,suffix:'-connected',description:'One opening, five connected exchanges, one return. Each middle exchange begins while the previous sound is still ringing.'},chapters:{make:createLivingJourneyStudy,suffix:'',description:'Seven self-contained chapters. Each presents the phrase, develops it across the bodies, and returns to its own opening.'},evolving:{make:createLivingEvolvingJourneyStudy,suffix:'-evolving',description:'One opening, twelve developing exchanges, one return. The rhythm turns and the accents move, then the familiar rhythm and accents come back before home.'}}[shape];
 plan=personalChoice?createLivingPersonalJourneyStudy(personalSource):treatment.make(seed);
 if(personalChoice||!continueSequence)continuation.stop();
 prepareEnsemble();
 buildScore();drawScore(0);
 url=personalChoice?'':`renders/living-journey-study/journey-${seed}${treatment.suffix}.wav`;
 $('download').href=url;$('report').href=url.replace(/\.wav$/,'.json');
 $('download').hidden=$('report').hidden=generatedChoice;
 $('download').setAttribute('download','');$('report').removeAttribute('download');$('report').textContent='Inspect the score';
 $('duration').textContent=clock(plan.frames/plan.sampleRate);
 $('description').textContent=personalChoice?`Your ${personalSource.events.length}-touch phrase opens the journey. Five exchanges turn its rhythm and move its accents, then the exact original returns. All of your touches remain in each variation; the whole opening and homecoming stand alone.`:treatment.description;
 $('personal-capabilities').hidden=!personalChoice;
 film?.refresh();
 rows=plan.sections.map(s=>{const li=document.createElement('li'),name=document.createElement('span'),time=document.createElement('small');name.textContent=s.name;time.textContent=`${clock(s.startFrame/plan.sampleRate)}–${clock(s.endFrame/plan.sampleRate)}`;li.append(name,time);return li;});
 $('chapters').replaceChildren(...rows);$('quiet').disabled=true;$('status').textContent='Ready when you are. Playback starts only when you choose Listen.';
}
async function listen(){
 film?.cancel();
 continuation.cancelPending();
 tuning.stop();
 const own=++generation;starting=true;player.stop();$('quiet').disabled=false;$('status').textContent=generatedChoice?'Making your journey locally… Quiet cancels preparation.':'Checking the journey audio and score…';
 try{
  await player.prepare();if(own!==generation)return;
  let verified;
  if(generatedChoice){
   const artifact=await generated.prepare(selectedRequest,plan,expectedSha256);if(own!==generation)return;verified=artifact.audioURL;
   const stem=personalChoice?'imagimusic-personal-journey':`imagimusic-journey-${artifact.seed}-${artifact.treatment}`;
   $('download').href=artifact.audioURL;$('download').download=stem+'.wav';$('report').href=artifact.reportURL;$('report').download=stem+'.json';$('report').textContent='Keep the score report';$('download').hidden=$('report').hidden=false;
  }else verified=await media.prepare(url,plan);
  if(own!==generation)return;const playing=await player.play(verified);if(own!==generation||!playing)return;starting=false;audio.hidden=false;update();
 }catch(error){if(own!==generation)return;continuation.stop();starting=false;player.stop();$('quiet').disabled=true;$('status').textContent=`Playback could not start: ${error.message} ${generatedChoice?'Try Listen again, or choose a prepared seed.':'See the local rendering instructions below.'}`;}
}
$('listen').addEventListener('click',listen);
function makeFreshJourney(continueSequence=false){
 let seed;do{seed=crypto.getRandomValues(new Uint32Array(1))[0];}while([...$('seed').options].some(o=>Number(o.value)===seed));
 let option=$('fresh-seed');if(!option){option=document.createElement('option');option.id='fresh-seed';option.dataset.generated='true';$('seed').append(option);}
 option.value=String(seed);option.textContent=`Your journey · ${seed}`;$('seed').value=String(seed);choose({continueSequence});listen();
}
$('new-journey').addEventListener('click',()=>makeFreshJourney(continuation.enabled&&!personalChoice));
$('open-journey').addEventListener('change',async()=>{
 const file=$('open-journey').files?.[0];$('open-journey').value='';if(!file)return;
 stop();tuning.stop();const own=++generation;starting=true;$('quiet').disabled=false;$('status').textContent='Reading the kept score…';
 try{
  if(file.size>LIVING_JOURNEY_REPORT_LIMIT)throw Error('The score report exceeds512KiB.');
  const text=await file.text();if(own!==generation)return;
  const kept=JSON.parse(text)?.kind==='imagimusic-living-personal-journey-artifact'?readLivingPersonalJourneyReport(text):readLivingJourneyReport(text);
  if(kept.request.kind==='imagimusic-living-personal-journey-request')selectPersonalSource(kept.request.source);
  else{
   let option=$('fresh-seed');if(!option){option=document.createElement('option');option.id='fresh-seed';option.dataset.generated='true';$('seed').append(option);}
   option.value=String(kept.request.seed);option.textContent=`Your kept idea · ${kept.request.seed}`;option.selected=true;
   document.querySelector(`[name=shape][value=${kept.request.treatment}]`).checked=true;choose();
  }
  expectedSha256=kept.expectedSha256;$('status').textContent='Kept score reopened quietly. Listen will regenerate it and verify the original audio identity.';
 }catch(error){if(own!==generation)return;starting=false;$('quiet').disabled=true;$('status').textContent=`The score could not open: ${error.message} Your previous selection is still available.`;}
});
function selectPersonalSource(source){
 createLivingPersonalJourneyStudy(source);
 personalSource=source;
 let option=$('personal-source');if(!option){option=document.createElement('option');option.id='personal-source';option.value='personal';$('seed').append(option);}
 option.textContent=`Your phrase · ${source.events.length} touches`;option.selected=true;choose();
}
$('use-personal-phrase').addEventListener('click',()=>{
 stop();tuning.stop();
 try{selectPersonalSource(readLivingPersonalPhrase($('personal-phrase').value));$('status').textContent='Your original phrase opened quietly. Choose Listen to hear its journey.';}
 catch(error){$('status').textContent=`The phrase could not open: ${error.message} Your previous selection is still available.`;}
});
$('open-personal-phrase').addEventListener('change',async()=>{
 const file=$('open-personal-phrase').files?.[0];$('open-personal-phrase').value='';if(!file)return;
 stop();tuning.stop();const own=++generation;starting=true;$('quiet').disabled=false;$('status').textContent='Reading your original phrase…';
 try{
  if(file.size>PERSONAL_PHRASE_INPUT_LIMIT)throw Error('The phrase file exceeds16KiB.');
  const text=await file.text();if(own!==generation)return;
  selectPersonalSource(readLivingPersonalPhrase(text));$('status').textContent='Your original phrase opened quietly. Choose Listen to hear its journey.';
 }catch(error){if(own!==generation)return;starting=false;$('quiet').disabled=true;$('status').textContent=`The phrase could not open: ${error.message} Your previous selection is still available.`;}
});
$('quiet').addEventListener('click',stop);
$('journey-continue').addEventListener('change',()=>{
 film?.cancel();
 if($('journey-continue').checked){continuation.enable();if(audio.ended&&!starting)continuation.queue();}
 else continuation.stop();
});
for(const id of ['download','report'])$(id).addEventListener('click',stop);
audio.addEventListener('ended',()=>continuation.queue());
audio.addEventListener('pause',()=>{if(!audio.ended&&!starting)continuation.stop();});
audio.addEventListener('error',()=>continuation.stop());
$('seed').addEventListener('change',choose);
for(const input of document.querySelectorAll('[name=shape]'))input.addEventListener('change',choose);
$('level').addEventListener('input',()=>{player.setDb(Number($('level').value));tuning.setDb(Number($('level').value));$('level-value').textContent=`+${$('level').value} dB`;});
audio.addEventListener('play',()=>{film?.cancel();continuation.cancelPending();tuning.stop();player.resume().catch(()=>{stop();$('status').textContent='Audio was interrupted. Choose Listen to try again.';});});
audio.addEventListener('playing',startAnimation);
for(const event of ['pause','ended','seeked'])audio.addEventListener(event,()=>{stopAnimation();drawEnsemble();if(event==='seeked')startAnimation();});
$('ensemble-motion').addEventListener('change',()=>{drawEnsemble();startAnimation();});
$('ensemble-veils').addEventListener('change',drawEnsemble);
$('ensemble').addEventListener('webglcontextlost',event=>{event.preventDefault();stop();stopAnimation();$('ensemble-status').textContent='Graphics were interrupted and playback paused. The ensemble will rebuild when graphics recover.';});
$('ensemble').addEventListener('webglcontextrestored',()=>{prepareEnsemble();drawEnsemble();});
for(const event of ['timeupdate','pause','playing','ended','seeked','error'])audio.addEventListener(event,()=>{if(plan)update();});
function park(){film?.cancel();continuation.stop();generation++;starting=false;media.cancel();generated.cancel();stopAnimation();player.park();if(plan)update();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);
choose();
film=setupLivingJourneyMovieControls({getSelection:()=>({request:selectedRequest,reveal:$('ensemble-veils').checked,expectedSha256}),beforePrepare:()=>{stop();tuning.stop();},onChange:update});
function openPersonalAddress(){
 const hash=location.hash;
 if(!hash.startsWith('#tine-live=')&&!hash.startsWith('#living='))return;
 stop();tuning.stop();
 try{selectPersonalSource(readLivingPersonalPhrase(hash));$('status').textContent='Your original phrase arrived quietly. Choose Listen to hear its longer journey.';}
 catch(error){$('status').textContent=`The incoming phrase could not open: ${error.message} Your current selection is still available.`;}
}
window.addEventListener('hashchange',openPersonalAddress);
openPersonalAddress();
