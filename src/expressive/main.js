import {composeExpressiveChord,composeExpressiveStudy,EXPRESSIVE_STUDY_PHASES} from '../midi2/expression.js';
import {createExpressionPerformance} from './performance.js';
import {createClipPerformance,renderClipAudio} from './clip-performance.js';
import {renderExpressionAudio} from './audio.js';
import {createExpressionScene,expressionSceneFrame,applyExpressionScene} from './scene.js';
import {createListeningTransport} from '../listen/transport.js';
import {createWorld} from '../stage/world.js';
import {encodeWav} from '../model.js';
const $=id=>document.getElementById(id),letters='ABCDEFGH';
let passage,score,world,scene,selectedVoice=0,lastReadout=-Infinity,clipSource=null,clipPrepared=null,loadRevision=0,fileReadPending=false;
const playbackDuration=()=>clipPrepared?.duration??passage.duration;
const descriptions={study:'A plain voice opens slowly. A second answers in the opposite direction; a lower voice remains as the others settle.',detachReset:'The old E keeps its expression. A new E begins with fresh controls; both still follow the shared pitch bend.',detachOnly:'The old E keeps its expression, and the new E inherits the current per-note controls.',resetOnly:'The held E follows the reset back toward neutral. No fourth voice enters.'};
function status(text,error=false){$('status').textContent=text;$('status').dataset.error=String(error);}
function prepare(input){
 // Rebuild at the actual context rate so both the image and audio use the same receiver limits.
 const prepared=input.clipSource?createClipPerformance(input.clipSource.bytes,{name:input.clipSource.name,sampleRate:input.sampleRate}):null;
 const p=prepared?.performance??createExpressionPerformance(input.score,undefined,input.sampleRate);clipPrepared=prepared;passage=p;$('seek').max=playbackDuration();
 let cancelled=false;
 const promise=new Promise(resolve=>setTimeout(resolve,0)).then(async()=>{
  if(cancelled)throw new DOMException('Cancelled','AbortError');
  const pcm=prepared?await renderClipAudio(prepared):await renderExpressionAudio(p);
  if(cancelled)throw new DOMException('Cancelled','AbortError');
  let peak=0;for(const value of pcm.channels[0]){if(!Number.isFinite(value))throw new Error('The rendered sound contains a non-finite sample.');peak=Math.max(peak,Math.abs(value));}
  if(peak>=.98)throw new Error('This render exceeds the study’s output headroom. Choose another study.');
  return pcm;
 });
 return {promise,cancel(){cancelled=true;}};
}
const transport=createListeningTransport({createContext:()=>new AudioContext(),prepare,onChange:({state})=>{
 $('listen').textContent=state==='preparing'?'Cancel':state==='playing'?'Pause':state==='ended'?'Listen again ↗':state==='paused'?'Continue ↗':'Listen ↗';
 $('save').disabled=!transport.pcm;
 if(state==='preparing')status('Preparing the independent voices…');
 else if(state==='playing')status('Follow one chamber, then another. Select a voice below to inspect its expression.');
 else if(state==='paused')status('Paused. Seek silently, or Continue from this moment.');
 else if(state==='ended')status(clipSource?'The imported passage has ended. Listen again, inspect a voice, or choose another source.':'The voices have settled. Try another way of passing expression to the next note.');
 else if(state==='idle')status('Ready when you are.');
}});
function choose(){
 loadRevision++;fileReadPending=false;$('listen').disabled=false;clipSource=null;clipPrepared=null;$('clip-report').hidden=true;$('clip-file').value='';$('clip-status').textContent='No Clip selected. Choose a local file to prepare it silently.';
 score=$('study').value==='study'?composeExpressiveStudy():composeExpressiveChord({scene:$('study').value});passage=createExpressionPerformance(score);transport.select(passage.duration);selectedVoice=0;lastReadout=-Infinity;
 $('study-note').textContent=descriptions[$('study').value];$('seek').max=passage.duration;
 const url=new URL(location.href);url.searchParams.set('scene',$('study').value);history.replaceState(null,'',url);
 buildVoices();
 if(world)rebuildScene();status('Press Listen. This short study reveals one kind of change at a time.');
}
function buildVoices(){
 $('voices').replaceChildren();
 for(const v of passage.voices){const button=document.createElement('button');button.className='voice-card';button.dataset.voice=v.voiceId;button.setAttribute('aria-pressed',String(v.voiceId===selectedVoice));const title=document.createElement('strong');title.textContent=`Voice ${letters[v.voiceId]}`;const detail=document.createElement('span');detail.textContent=`Note ${v.address.noteNumber} · Waiting`;button.append(title,detail);button.onclick=()=>{selectedVoice=v.voiceId;lastReadout=-Infinity;for(const b of $('voices').children)b.setAttribute('aria-pressed',String(Number(b.dataset.voice)===selectedVoice));};$('voices').append(button);}
}
function rebuildScene(next=createExpressionScene(passage.voices.length)){
 world.scene.add(next.root);
 if(scene){world.scene.remove(scene.root);scene.root.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});}
 scene=next;
 world.camera.position.set(1,4.6,Math.max(10,passage.voices.length*2.9));world.controls.target.set(0,1.3,0);world.controls.update();
}
$('clip-file').onchange=async()=>{
 const file=$('clip-file').files[0];if(!file)return;
 const own=++loadRevision;let installed=false;fileReadPending=true;transport.stop();$('listen').disabled=true;$('clip-status').textContent='Preparing the local file silently…';
 try{
  if(file.size>262144)throw new Error('Clip files must be at most 256 KiB.');
  const bytes=new Uint8Array(await file.arrayBuffer());if(own!==loadRevision)return;
  const name=file.name.slice(0,120),candidate=createClipPerformance(bytes,{name});
  const nextScene=world?createExpressionScene(candidate.performance.voices.length):null;
  if(own!==loadRevision)return;
  installed=true;clipSource={bytes,name};clipPrepared=candidate;passage=candidate.performance;score=passage.score;
  transport.select(candidate.duration);selectedVoice=0;lastReadout=-Infinity;$('seek').max=candidate.duration;
  $('study').value='clip';$('study-note').textContent='Your local Clip, interpreted by this synthesizer. Its original instruments and acoustic character are not reconstructed.';
  const url=new URL(location.href);url.searchParams.delete('scene');history.replaceState(null,'',url);
  buildVoices();if(world)rebuildScene(nextScene);
  const report=candidate.imported.report,unsupported=report.unsupported.length;
  $('clip-summary').textContent=`${name} · ${passage.voices.length} ${passage.voices.length===1?'note':'notes'} · ${score.events.length} decoded events. Setup: ${candidate.imported.origin.seconds.toFixed(6)} s, omitted from playback after preparation. ${report.assumedTempo?'Undeclared tempo: this receiver used 120 BPM for part or all of the source.':'Declared tempo used.'} ${unsupported} undecoded packets retained and not applied. ${report.evaluator.unsupported.length} unsupported and ${report.evaluator.partial.length} partial evaluator message types. Listen renders at your audio context’s sample rate; the origin rounds forward by less than one sample.`;
  $('clip-details').textContent=JSON.stringify({...report,unsupported:report.unsupported.slice(0,64),displayNote:unsupported>64?'Showing the first 64 undecoded packets; the complete imported report retains all of them.':'All undecoded packets shown.'},null,2);
  $('clip-report').hidden=false;$('clip-status').textContent='Prepared locally. No sound has played. Press Listen when ready.';status('Local Clip ready. Review its receiver report, then choose Listen.');
 }catch(error){if(own===loadRevision)$('clip-status').textContent='Could not prepare this file: '+error.message+(installed?' The Clip was admitted, but its display could not be completed. Choose a study to reset.':' Your prior study remains selected.');}
 finally{if(own===loadRevision){fileReadPending=false;$('listen').disabled=false;}}
};
$('study').onchange=choose;
$('listen').onclick=async()=>{
 if(['playing','preparing'].includes(transport.state)){transport.stop();return;}
 try{await transport.play({score,clipSource});if(transport.state==='playing'&&world)$('world').parentElement.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch(error){status(error.message,true);}
};
$('quiet').onclick=()=>{transport.stop();cancelFileRead();};$('seek').oninput=()=>transport.seek(Number($('seek').value));
$('save').onclick=()=>{const pcm=transport.pcm;if(!pcm)return;const url=URL.createObjectURL(new Blob([encodeWav(pcm.channels[0],pcm.sampleRate)],{type:'audio/wav'})),link=document.createElement('a');link.href=url;link.download=`imagimusic-expression-${clipSource?'local-clip':$('study').value}.wav`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
function cancelFileRead(){loadRevision++;if(fileReadPending){$('clip-file').value='';$('clip-status').textContent='File preparation cancelled. The prior study remains selected.';}fileReadPending=false;$('listen').disabled=false;}
document.addEventListener('visibilitychange',()=>{if(document.hidden){transport.stop();cancelFileRead();}});window.addEventListener('pagehide',()=>{transport.stop();cancelFileRead();});
const initial=new URLSearchParams(location.search).get('scene');if(Object.hasOwn(descriptions,initial))$('study').value=initial;
choose();
try{world=createWorld($('world'));for(const body of [...world.garden,...world.choir,world.tine])body.root.visible=false;world.rail.visible=false;rebuildScene();}catch(error){$('world').hidden=true;status('The 3D view is unavailable here. Sound and per-voice inspection remain available.',true);}
function updateReadout(frame){
 for(const button of $('voices').children){const v=frame.voices.find(v=>v.voiceId===Number(button.dataset.voice));button.querySelector('span').textContent=v?`${v.frequencyHz.toFixed(1)} Hz · ${v.retired?'Settled':v.detached?'Detached':v.env.stage}`:'Waiting for this voice';}
 const voice=frame.voices.find(v=>v.voiceId===selectedVoice);$('voice-title').textContent=`Voice ${letters[selectedVoice]}`;
 $('voice-state').textContent=voice?`${voice.retired?'Settled':voice.env.stage.toUpperCase()} · ${voice.detached?'Per-note expression detached; channel bend still applies.':'Following its per-note expression.'}${voice.pitchClamped?' Pitch limited by the receiver/audio range.':''}`:'This voice has not entered yet.';
 const rows=voice?[['Pitch',`${voice.frequencyHz.toFixed(3)} Hz`],['Pressure',voice.pressure01.toFixed(6)],['Brightness',voice.brightness01.toFixed(9)],['Lowpass cutoff',`${voice.cutoffHz.toFixed(3)} Hz`],['Filter Q',`${voice.q.toFixed(4)} dB`],['Amplitude',voice.gain.toFixed(6)]]:[];
 $('voice-values').replaceChildren();for(const [name,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value;$('voice-values').append(dt,dd);}
 $('raw').textContent=voice?JSON.stringify({address:voice.address,...voice.raw},null,2):'No Note On yet.';
}
function draw(){
 const t=transport.time(),frame=expressionSceneFrame(passage,t+(clipPrepared?.playbackOriginSeconds??0));
 if(world){const zoom=Math.min(1,$('world').clientWidth/Math.max(1,$('world').clientHeight)/1.5);if(world.camera.zoom!==zoom){world.camera.zoom=zoom;world.camera.updateProjectionMatrix();}applyExpressionScene(frame,scene);world.render();}
 $('chapter').textContent=$('study').value==='study'?EXPRESSIVE_STUDY_PHASES.filter(phase=>phase.from<=t).at(-1).title.toUpperCase():clipSource?'YOUR MIDI CLIP':'A SHARED CHORD';
 $('seek').value=t;$('time').textContent=`${t.toFixed(2)} / ${playbackDuration().toFixed(2)} s`;$('clock').textContent=`${frame.voices.filter(v=>!v.retired).length} active voices`;
 if(Math.abs(t-lastReadout)>.08||lastReadout===-Infinity){updateReadout(frame);lastReadout=t;}
 requestAnimationFrame(draw);
}
draw();
