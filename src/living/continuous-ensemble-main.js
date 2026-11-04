import {setupContinuousEnsembleReplay} from './continuous-ensemble-replay.js';
import {setupContinuousEnsembleControls} from './continuous-ensemble-controls.js';
import {createContinuousEnsembleVisual} from './continuous-ensemble-visual.js';
const $=id=>document.getElementById(id);let replay=null;
$('body-motion').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
const visual=createContinuousEnsembleVisual({canvas:$('body-canvas'),motion:$('body-motion'),details:$('body-view'),status:$('body-status'),getTime:()=>controls.time()});
const controls=setupContinuousEnsembleControls({visual,beforePlay:()=>replay?.stop(),elements:{...Object.fromEntries(['start','quiet','seed','status','count','result','whole'].map(name=>[name,$(name)])),downloads:[1,2,3].map(i=>$(`voice-${i}`))}});
replay=setupContinuousEnsembleReplay({elements:Object.fromEntries(['file','prepare','cancel','listen','quiet','audio','status','wav','json'].map(name=>[name,$(`replay-${name}`)])),getSource:()=>{const finished=controls.finished;return finished?{kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:finished.records}:null;},beforePlay:()=>controls.stop()});
const phases=['Opening','Echo','Reflection','Space','Gathering','Thinning','Recollection','Return'],marks=[...document.querySelectorAll('.phases li')];
function draw(){
 const showing=['playing','ending','verifying','ended'].includes(controls.state),seconds=showing?controls.time():0,index=Math.min(7,Math.floor(seconds/6));
 $('progress').value=seconds;$('phase').textContent=showing?phases[index]:'One idea, three voices';$('elapsed').textContent=`${Math.floor(seconds)} / 48 seconds`;
 marks.forEach((mark,i)=>{mark.classList.toggle('current',showing&&i===index);if(showing&&i===index)mark.setAttribute('aria-current','step');else mark.removeAttribute('aria-current');});
}
let timer=setInterval(draw,200);draw();
$('level').addEventListener('input',()=>{const db=Number($('level').value);controls.setDb(db);replay.setDb(db);$('level-value').textContent=`+${db} dB`;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){controls.stop();replay.stop();}});
window.addEventListener('pagehide',()=>{controls.stop();replay.stop();clearInterval(timer);});
window.addEventListener('pageshow',event=>{if(event.persisted){clearInterval(timer);timer=setInterval(draw,200);draw();}});
