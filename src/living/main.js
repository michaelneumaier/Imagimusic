import {createLivingScene} from './scene.js';
import {createTineLiveSession} from '../tine/live-session.js';
import {createTineDesign} from '../tine/address.js';
import {tineLiveRecordFromFinished} from '../tine/live-record.js';
import {tineLiveFragment} from '../tine/live-address.js';
const $=id=>document.getElementById(id),canvas=$('instrument'),status=$('scene-status'),buttons=[...document.querySelectorAll('[data-view]')];
const design=createTineDesign();let world=null,session=null,raf=0,wantsFocus=false,returnFocus=false;
const active=state=>['preparing','playing','ringing','ending'].includes(state);
function controls(state,touches){$('begin').disabled=!world||active(state);$('touch').disabled=state!=='playing'||touches>=8;$('quiet').disabled=!active(state)||state==='ending';$('touch-count').textContent=`${touches} / 8 touches`;}
function touch(){if(!session||$('touch').disabled)return;session.strike(.1).catch(error=>{if(error.name!=='AbortError')$('playing-status').textContent=error.message;});}
function animate(){raf=0;const t=session.time();$('remaining').textContent=t<4?`${Math.max(0,4-t).toFixed(1)} seconds to touch`:'Letting it ring';if(active(session.state))raf=requestAnimationFrame(animate);}
try{
 world=createLivingScene(canvas,{onTouch:touch});status.textContent='80 × 10 × 1 mm · drag to look around';
 for(const button of buttons)button.addEventListener('click',()=>{world.view(button.dataset.view);for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));status.textContent=button.textContent;});
}catch(error){status.textContent='The 3D view could not open. The sound sketch and scene boards are available below.';for(const b of buttons)b.disabled=true;console.error(error);}
session=createTineLiveSession({listeningDb:0,onChange:event=>{
 const touchFocused=document.activeElement===$('touch'),quietFocused=document.activeElement===$('quiet');
 if(event.state==='ending'&&(touchFocused||quietFocused))returnFocus=true;
 controls(event.state,event.touches);
 const messages={preparing:'Preparing the instrument…',playing:'Touch the blade, or use the Touch button.',ringing:'The touch window has closed. Let it ring, or choose Quiet.',ending:'Ending gently…',ended:'The phrase has settled. Begin again when you choose.',interrupted:'Playing stopped while the page or audio was away. Begin again when ready.',cancelled:'Preparation cancelled.',error:event.message};
 $('playing-status').textContent=messages[event.state]??'Opening is quiet. Begin when you choose.';
 if(event.event){world?.acknowledgeTouch();$('touch-note').textContent=`Touch ${event.touches} accepted at sample ${event.event.frame}. The gold spot marks the fixed touch position; it is not a vibration display.`;}
 if(event.finished?.snapshot.events.length){
  try{const record=tineLiveRecordFromFinished(event.finished);$('open-phrase').href='tine-play.html'+tineLiveFragment(record);$('phrase-path').hidden=false;$('phrase-note').textContent=`${record.events.length} ${record.events.length===1?'touch':'touches'} kept for this visit. Open the phrase to replay, compare bodies, or keep its address.`;}
  catch(error){$('playing-status').textContent='The pass ended, but its handoff could not be prepared: '+error.message;}
 }
 if(event.finished&&!event.finished.snapshot.events.length)$('playing-status').textContent='This pass ended without touches.'+(!$('phrase-path').hidden?' Your previous phrase remains available.':'');
 if(event.state==='playing'&&wantsFocus){wantsFocus=false;$('touch').focus({preventScroll:true});}
 if(touchFocused&&$('touch').disabled&&!$('quiet').disabled)$('quiet').focus({preventScroll:true});
 if(!active(event.state)){cancelAnimationFrame(raf);raf=0;$('remaining').textContent='Quiet';if(touchFocused||quietFocused||returnFocus)$('begin').focus({preventScroll:true});returnFocus=false;}
 else if(event.state==='playing'&&!raf)raf=requestAnimationFrame(animate);
}});
$('begin').addEventListener('click',async()=>{
 world?.acknowledgeTouch(false);wantsFocus=true;$('touch-note').textContent='Touches join the vibration already ringing. The gold spot appears only after a touch is accepted.';
 document.querySelector('.scene').scrollIntoView({block:'center',behavior:'instant'});
 try{await session.start(design);}catch(error){if(error.name!=='AbortError')$('playing-status').textContent=error.message;}
});
$('touch').addEventListener('click',touch);
$('touch').addEventListener('keydown',event=>{if(event.repeat&&(event.code==='Space'||event.code==='Enter'))event.preventDefault();});
$('quiet').addEventListener('click',()=>session.quiet().catch(error=>{if(error.name!=='AbortError')$('playing-status').textContent=error.message;}));
$('level').addEventListener('input',()=>{session.setListeningDb(Number($('level').value));$('level-value').textContent=`+${$('level').value} dB`;});
function park(){wantsFocus=false;session.park();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();park();status.textContent='The 3D view was interrupted. Reload to restore it; the sound sketch remains available.';for(const b of buttons)b.disabled=true;world?.dispose();world=null;controls(session.state,session.touches);});
controls('idle',0);
