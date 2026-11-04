import {createLivingJourneyStudy} from './journey-study.js';
import {createLivingConnectedJourneyStudy} from './connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from './evolving-journey-study.js';
import {createTineStudyPlayer} from '../tine/study-player.js';
import {createLivingJourneyScore} from './journey-score.js';
import {createLivingJourneyView} from './journey-view.js';
import {createLivingJourneyLayout} from './journey-layout.js';
import {createLivingScene} from './scene.js';

const $=id=>document.getElementById(id),audio=$('audio'),player=createTineStudyPlayer({audio});
let plan,url,rows=[],generation=0,starting=false;
let score,marks=[],cursors=[];
let scene=null,journeyView=null,raf=0,lastDraw=-Infinity;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
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
 try{journeyView=createLivingJourneyView(plan);scene=createLivingScene($('ensemble'),{ensemble:createLivingJourneyLayout(journeyView.allocation)});scene.setLook('dusk');scene.instanceFrame(journeyView.at(0),$('ensemble-veils').checked);$('ensemble-status').textContent=`${journeyView.allocation.instances.length} independent instruments · held camera · sound follows the selected score.`;}
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
 $('quiet').disabled=audio.paused&&!starting;
 if(!starting)$('status').textContent=audio.error?'Audio unavailable. See the local rendering instructions below.':audio.ended?'The journey has settled.':`${audio.paused?'Paused':'Playing'} · ${clock(audio.currentTime)} · ${active.map(s=>s.name).join(' / ')||'a moment of space'}`;
}
function stop(){generation++;starting=false;player.stop();update();}
function choose(){
 generation++;starting=false;player.stop();audio.hidden=true;audio.removeAttribute('src');audio.load();
 const shape=document.querySelector('[name=shape]:checked').value,seed=Number($('seed').value);
 const treatment={connected:{make:createLivingConnectedJourneyStudy,suffix:'-connected',description:'One opening, five connected exchanges, one return. Each middle exchange begins while the previous sound is still ringing.'},chapters:{make:createLivingJourneyStudy,suffix:'',description:'Seven self-contained chapters. Each presents the phrase, develops it across the bodies, and returns to its own opening.'},evolving:{make:createLivingEvolvingJourneyStudy,suffix:'-evolving',description:'One opening, twelve developing exchanges, one return. The rhythm turns and the accents move, then the familiar rhythm and accents come back before home.'}}[shape];
 plan=treatment.make(seed);
 prepareEnsemble();
 buildScore();drawScore(0);
 url=`renders/living-journey-study/journey-${seed}${treatment.suffix}.wav`;
 $('download').href=url;$('report').href=url.replace(/\.wav$/,'.json');
 $('duration').textContent=clock(plan.frames/plan.sampleRate);
 $('description').textContent=treatment.description;
 rows=plan.sections.map(s=>{const li=document.createElement('li'),name=document.createElement('span'),time=document.createElement('small');name.textContent=s.name;time.textContent=`${clock(s.startFrame/plan.sampleRate)}–${clock(s.endFrame/plan.sampleRate)}`;li.append(name,time);return li;});
 $('chapters').replaceChildren(...rows);$('quiet').disabled=true;$('status').textContent='Ready when you are. Playback starts only when you choose Listen.';
}
$('listen').addEventListener('click',async()=>{
 const own=++generation;starting=true;$('quiet').disabled=false;$('status').textContent='Preparing the journey…';
 try{const playing=await player.play(url);if(own!==generation||!playing)return;starting=false;audio.hidden=false;update();}
 catch(error){if(own!==generation)return;starting=false;player.stop();$('quiet').disabled=true;$('status').textContent='Playback could not start. Check the local rendering instructions below, then try Listen again.';}
});
$('quiet').addEventListener('click',stop);
$('seed').addEventListener('change',choose);
for(const input of document.querySelectorAll('[name=shape]'))input.addEventListener('change',choose);
$('level').addEventListener('input',()=>{player.setDb(Number($('level').value));$('level-value').textContent=`+${$('level').value} dB`;});
audio.addEventListener('play',()=>player.resume().catch(()=>{stop();$('status').textContent='Audio was interrupted. Choose Listen to try again.';}));
audio.addEventListener('playing',startAnimation);
for(const event of ['pause','ended','seeked'])audio.addEventListener(event,()=>{stopAnimation();drawEnsemble();if(event==='seeked')startAnimation();});
$('ensemble-motion').addEventListener('change',()=>{drawEnsemble();startAnimation();});
$('ensemble-veils').addEventListener('change',drawEnsemble);
$('ensemble').addEventListener('webglcontextlost',event=>{event.preventDefault();stop();stopAnimation();$('ensemble-status').textContent='Graphics were interrupted and playback paused. The ensemble will rebuild when graphics recover.';});
$('ensemble').addEventListener('webglcontextrestored',()=>{prepareEnsemble();drawEnsemble();});
for(const event of ['timeupdate','pause','playing','ended','seeked','error'])audio.addEventListener(event,()=>{if(plan)update();});
function park(){generation++;starting=false;stopAnimation();player.park();if(plan)update();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);
choose();
