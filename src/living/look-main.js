import {createLivingStudyFixtures,createLivingGeneratedStudyFixtures} from './study-fixtures.js';
import {createLivingChoreography} from './choreography.js';
import {LIVING_LOOKS} from './looks.js';
import {createLivingArrangement} from './arrangement.js';
import {createLivingSpacedAnswer} from './answer-study.js';
import {createLivingArrangementView} from './arrangement-view.js';
import {createLivingScene} from './scene.js';
const $=id=>document.getElementById(id),audio=$('audio');
const fixtures=[...createLivingStudyFixtures().map(f=>({...f,audioDirectory:'living-answer-study'})),...createLivingGeneratedStudyFixtures().map(f=>({...f,audioDirectory:'living-generated-answer-study'}))];let fixtureId='greeting';
const source=()=>fixtures.find(f=>f.id===fixtureId).source;
let composition='round',plan=createLivingArrangement(source()),view=createLivingArrangementView(plan);
let choreography=createLivingChoreography(source());
const duration=()=>plan.frames/plan.sampleRate;
const names={round:'Overlapping round',spaced:'Spaced answer'};
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let choseMotion=false;
$('camera-motion').checked=!motionPreference.matches;
let contactDetail=false;
let scene,look='original',seconds=1,raf=0,lastPaint=-Infinity,url=null,saveVersion=0,statusKey='';
function draw(){
 if(!scene)return;const frame=view.at(seconds);scene.performers($('performers').checked?choreography.at(seconds):[]);scene.arrangementFrame(frame,$('reveal').checked,$('camera-motion').checked,contactDetail);
 $('camera-motion').disabled=contactDetail;for(const b of document.querySelectorAll('[data-framing]'))b.setAttribute('aria-pressed',String((b.dataset.framing==='contact')===contactDetail));
 $('moment').value=seconds;$('time').textContent=seconds.toFixed(2)+' seconds';const key=fixtureId+':'+composition+':'+look+':'+frame.part+':'+audio.paused+':'+$('camera-motion').checked+':'+contactDetail;if(key!==statusKey){statusKey=key;$('status').textContent=`${audio.paused?'Paused':'Playing'} · ${fixtures.find(f=>f.id===fixtureId).name} · ${names[composition]} · ${LIVING_LOOKS[look].name} · ${frame.part==='answer'?'three voices':frame.part==='return'?'return':'opening solo'} · ${contactDetail?'original blade · paused contact detail':$('camera-motion').checked?'following camera':'held camera'}`;}
 $('scene').setAttribute('aria-label',`${LIVING_LOOKS[look].name}: ${contactDetail?'original blade contact close-up':!$('camera-motion').checked||frame.part==='answer'?'three independent steel blades':'one steel blade'} at ${seconds.toFixed(2)} seconds. ${$('reveal').checked?'Magnified response veils shown.':'Solid bodies only.'} ${$('performers').checked?'Experimental score-driven strikers shown.':''}`);
}
function tick(stamp){raf=0;if(audio.paused)return;if(stamp-lastPaint>=1000/30){seconds=Math.min(duration(),audio.currentTime);draw();lastPaint=stamp;}raf=requestAnimationFrame(tick);}
function pause(){audio.pause();cancelAnimationFrame(raf);raf=0;}
function seek(t){pause();seconds=Math.max(0,Math.min(duration(),t));if(audio.readyState)audio.currentTime=seconds;draw();}
try{scene=createLivingScene($('scene'),{width:1280,height:720});draw();$('save').disabled=false;}catch(error){$('status').textContent='The visual workshop could not open: '+error.message;}
$('description').textContent=LIVING_LOOKS[look].description;
for(const b of document.querySelectorAll('[data-look]'))b.addEventListener('click',()=>{look=b.dataset.look;scene?.setLook(look);$('description').textContent=LIVING_LOOKS[look].description;for(const c of document.querySelectorAll('[data-look]'))c.setAttribute('aria-pressed',String(c===b));draw();});
for(const b of document.querySelectorAll('[data-chapter]'))b.addEventListener('click',()=>{contactDetail=false;seek(b.dataset.chapter==='opening'?1:b.dataset.chapter==='answer'?(plan.roundStart+plan.delayFrames)/plan.sampleRate+1:plan.returnStart/plan.sampleRate+1);});
function chooseScore(){
 pause();contactDetail=false;plan=composition==='round'?createLivingArrangement(source()):createLivingSpacedAnswer(source());view=createLivingArrangementView(plan);choreography=createLivingChoreography(source(),composition);seconds=1;lastPaint=-Infinity;
 $('moment').max=duration();audio.src=`renders/${fixtures.find(f=>f.id===fixtureId).audioDirectory}/${fixtureId}-${composition}.wav`;audio.load();audio.pause();
 $('audio-note').textContent=`${fixtures.find(f=>f.id===fixtureId).name} · ${names[composition]} · ${duration().toFixed(1)} seconds · dry bodies · preview gain ×8. Choose Play when ready.`;
 for(const c of document.querySelectorAll('[data-composition]'))c.setAttribute('aria-pressed',String(c.dataset.composition===composition));
 $('generated-fixture').value=fixtures.find(f=>f.id===fixtureId).seed===undefined?'':fixtureId;
 for(const c of document.querySelectorAll('[data-fixture]'))c.setAttribute('aria-pressed',String(c.dataset.fixture===fixtureId));
 $('download').hidden=true;saveVersion++;draw();
}
for(const b of document.querySelectorAll('[data-composition]'))b.addEventListener('click',()=>{composition=b.dataset.composition;chooseScore();});
for(const b of document.querySelectorAll('[data-fixture]'))b.addEventListener('click',()=>{fixtureId=b.dataset.fixture;chooseScore();});
$('generated-fixture').addEventListener('change',()=>{fixtureId=$('generated-fixture').value||'greeting';chooseScore();});
for(const b of document.querySelectorAll('[data-contact]'))b.addEventListener('click',()=>{$('performers').checked=true;const onset=plan.source.events[0].frame/plan.sampleRate;seek(onset+({approach:-.09,contact:0,recover:.14}[b.dataset.contact]));});
for(const b of document.querySelectorAll('[data-framing]'))b.addEventListener('click',()=>{pause();contactDetail=b.dataset.framing==='contact';if(contactDetail)$('performers').checked=true;draw();});
$('moment').addEventListener('input',()=>seek(Number($('moment').value)));
$('reveal').addEventListener('change',draw);
$('performers').addEventListener('change',()=>{pause();draw();});
$('camera-motion').addEventListener('change',()=>{choseMotion=true;pause();draw();});
motionPreference.addEventListener('change',()=>{if(!choseMotion){pause();$('camera-motion').checked=!motionPreference.matches;draw();}});
audio.addEventListener('loadedmetadata',()=>{audio.currentTime=seconds;});
audio.addEventListener('play',()=>{contactDetail=false;draw();if(!raf)raf=requestAnimationFrame(tick);});
audio.addEventListener('pause',()=>{cancelAnimationFrame(raf);raf=0;seconds=Math.min(duration(),audio.currentTime);draw();});
audio.addEventListener('seeked',()=>{seconds=Math.min(duration(),audio.currentTime);draw();});
audio.addEventListener('error',()=>{$('status').textContent='The example audio could not load. Still inspection remains available; run the local project preparation helper if needed.';});
$('save').addEventListener('click',()=>{const playing=!audio.paused;pause();if(playing)seconds=Math.min(duration(),audio.currentTime);draw();const own=++saveVersion,name=`living-${fixtureId}-${composition}-${look}-${contactDetail?'close':$('camera-motion').checked?'follow':'held'}-${$('performers').checked?'contact-':''}${seconds.toFixed(2)}s.png`;$('scene').toBlob(blob=>{if(own!==saveVersion)return;if(!blob){$('status').textContent='The still could not be captured.';return;}if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);$('download').href=url;$('download').download=name;$('download').textContent='Save '+name;$('download').hidden=false;},'image/png');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',pause);

if(audio.readyState)audio.currentTime=seconds;
