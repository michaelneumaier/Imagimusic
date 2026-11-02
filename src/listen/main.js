import {LOOM_JOURNEYS,getLoomJourney} from './journeys.js';
import {createWorld} from '../stage/world.js';
import {compositionPageURL} from '../stage/composition-link.js';
import {loomSceneFrame,applyLoomScene} from '../loom/scene.js';
import {createLoomPerformance,loomPerformanceFrame} from '../loom/performance.js';
import {createLoomRenderJob} from '../loom/render-job.js';
import {stereoWav} from '../loom/model.js';
import {createListeningTransport} from './transport.js';
const $=id=>document.getElementById(id);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let still=reduced.matches,selected,passage,world,chapterIndex=-2;
function status(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
const transport=createListeningTransport({createContext:()=>new AudioContext(),prepare:createLoomRenderJob,onChange:({state})=>{
 $('listen').textContent=state==='preparing'?'Cancel':state==='playing'?'Pause':state==='ended'?'Listen again ↗':state==='paused'?'Continue ↗':'Listen ↗';
 $('save').disabled=!transport.pcm;
 if(state==='preparing')status('Preparing this passage…');
 else if(state==='playing')status('Follow either body. Quiet pauses the passage; the timeline lets you return to a moment.');
 else if(state==='ended')status('Let the silence stay a moment. Listen again, play this connection yourself, or choose another passage.');
 else if(state==='idle')status('Ready when you are. Press Listen to begin.');
 else if(state==='paused')status('Paused. Continue from here, or choose a moment on the timeline.');
}});
const format=t=>`${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;
for(const [i,journey] of LOOM_JOURNEYS.entries()){
 const button=document.createElement('button');button.type='button';button.className='passage';button.dataset.journey=journey.id;
 const number=document.createElement('span');number.className='number';number.textContent=`0${i+1} / LISTENING STUDY`;
 const title=document.createElement('h2');title.textContent=journey.title;
 const description=document.createElement('p');description.textContent=journey.description;
 const length=document.createElement('span');length.className='duration';length.textContent=`${Math.ceil(createLoomPerformance(journey.settings,journey.score).duration)} SECONDS · STEREO`;
 button.append(number,title,description,length);button.onclick=()=>choose(journey.id);$('passages').append(button);
}
function choose(id){
 selected=getLoomJourney(id);passage=createLoomPerformance(selected.settings,selected.score);transport.select(passage.duration);chapterIndex=-2;
 $('seek').max=passage.duration;$('seek').value=0;
 for(const button of $('passages').children)button.setAttribute('aria-pressed',String(button.dataset.journey===id));
 const url=new URL(location.href);url.searchParams.set('study',id);history.replaceState(null,'',url);
 $('explore').href=compositionPageURL(location.href,'loom.html',{version:1,loom:{enabled:true,settings:selected.settings}});
 const playing=new URL('touch.html',location.href);playing.searchParams.set('bridge',selected.id);
 for(const link of document.querySelectorAll('[data-play-connection]')){link.href=playing.href;link.textContent=`Play ${selected.title} ↗`;}
 $('model-detail').textContent=`This passage holds the connection fixed: ${selected.settings.frequency} Hz base tuning, ${selected.settings.detune} cents detuning, coupling ${selected.settings.coupling}, loss ${selected.settings.loss}/s. Changes between studies affect the actual sound model. Camera movement changes framing only.`;
 status(`${selected.title}. Press Listen. Headphones reveal the stereo space; Escape brings Quiet.`);
}
$('listen').onclick=async()=>{
 if(['playing','preparing'].includes(transport.state)){transport.stop();return;}
 try{await transport.play({settings:selected.settings,score:selected.score,body:null});if(transport.state==='playing'&&world)$('world').parentElement.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});}catch(error){status(error.message,true);}
};
$('quiet').onclick=()=>transport.stop();
window.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();transport.stop();}});
$('seek').oninput=()=>transport.seek(Number($('seek').value));
$('save').onclick=()=>{
 const pcm=transport.pcm;if(!pcm)return;
 const url=URL.createObjectURL(new Blob([stereoWav(pcm)],{type:'audio/wav'})),link=document.createElement('a');link.href=url;link.download=`imagimusic-${selected.id}.wav`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
};
function motion(){
 $('motion').setAttribute('aria-pressed',String(still));$('motion').textContent=still?'Still camera · on':'Still camera';
 if(world)world.controls.enabled=still;
}
$('motion').onclick=()=>{still=!still;motion();};
reduced.addEventListener('change',event=>{still=event.matches;motion();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)transport.stop();});
window.addEventListener('pagehide',()=>transport.stop());
let requested=new URLSearchParams(location.search).get('study');
if(!LOOM_JOURNEYS.some(item=>item.id===requested))requested=LOOM_JOURNEYS[0].id;
choose(requested);
try{
 world=createWorld($('world'));
 for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;
 world.rail.visible=false;world.loom.root.position.set(0,0,1);world.loom.root.scale.setScalar(1);world.loom.root.visible=true;
 world.camera.position.set(0,3.6,10);world.controls.target.set(0,1.1,1);world.controls.update();motion();
}catch(error){$('world').hidden=true;status('The 3D view is unavailable here. You can still listen to every passage.',true);}
function draw(){
 const time=transport.time();
 if(world){
  const aspect=$('world').clientWidth/Math.max(1,$('world').clientHeight),zoom=Math.min(1,aspect/1.5);
  if(world.camera.zoom!==zoom){world.camera.zoom=zoom;world.camera.updateProjectionMatrix();}
  applyLoomScene(loomSceneFrame(loomPerformanceFrame(passage,time),selected.settings,{active:true}),world.loom);
  if(!still){const u=time/passage.duration;world.camera.position.set(Math.sin(u*Math.PI*1.2)*1.8,3.6-.3*Math.sin(u*Math.PI),10-.8*Math.sin(u*Math.PI));world.controls.target.set(0,1.1,1);world.controls.update();}
  world.render();
 }
 $('seek').value=time;$('time').textContent=`${format(time)} / ${format(Math.ceil(passage.duration))}`;
 const index=selected.chapters.findLastIndex(chapter=>chapter.time<=time);
 if(index!==chapterIndex){chapterIndex=index;const chapter=selected.chapters[index];$('chapter').textContent=chapter?.title??selected.title;$('chapter-note').textContent=chapter?.description??'Choose a passage below. Sound begins only when you press Listen.';}
 requestAnimationFrame(draw);
}
draw();
