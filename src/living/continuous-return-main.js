import {setupContinuousReturnControls} from './continuous-return-controls.js';
import {createContinuousReturnVisual} from './continuous-return-visual.js';
import {setupContinuousReturnReplay} from './continuous-return-replay.js';
const $=id=>document.getElementById(id),names=['start','quiet','pad','strength','seed','status','count','download','result'];
let replay=null;
$('body-motion').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
const visual=createContinuousReturnVisual({canvas:$('body-canvas'),motion:$('body-motion'),details:$('body-view'),status:$('body-status'),getTime:()=>controls.time()});
const controls=setupContinuousReturnControls({elements:Object.fromEntries(names.map(name=>[name,$(name)])),beforePlay:()=>replay?.stop(),visual});
replay=setupContinuousReturnReplay({elements:Object.fromEntries(['file','prepare','cancel','listen','quiet','audio','status','wav','json'].map(name=>[name,$(`replay-${name}`)])),getSource:()=>controls.finished?.record,beforePlay:()=>controls.stop()});
const phases=['Opening','Echo','Reflection','Space','Gathering','Thinning','Recollection','Return'];
const marks=[...document.querySelectorAll('.phases li')];
function draw(){
 const showing=['playing','ending','verifying','ended'].includes(controls.state),seconds=showing?controls.time():0,index=Math.min(7,Math.floor(seconds/6));$('progress').value=seconds;
 $('phase').textContent=!showing?'A gesture, and its return':phases[index];
 marks.forEach((mark,i)=>{mark.classList.toggle('current',i===index&&showing);if(i===index&&showing)mark.setAttribute('aria-current','step');else mark.removeAttribute('aria-current');});
 $('elapsed').textContent=`${Math.floor(seconds)} / 48 seconds`;
}
let timer=setInterval(draw,200);draw();
$('level').addEventListener('input',()=>{const db=Number($('level').value);controls.setDb(db);replay.setDb(db);$('level-value').textContent=`+${db} dB`;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){controls.stop();replay.stop();}});
window.addEventListener('pagehide',()=>{controls.stop();replay.stop();clearInterval(timer);});
window.addEventListener('pageshow',event=>{if(event.persisted){clearInterval(timer);timer=setInterval(draw,200);draw();}});
