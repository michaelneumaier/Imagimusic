import {createLivingResponse} from './response.js';
import {createLivingScene} from './scene.js';
import {createTineLiveSession} from '../tine/live-session.js';
import {createTineLiveCapture} from '../tine/live-capture.js';
import {createGroveReplay} from '../grove/replay.js';
import {createTineDesign} from '../tine/address.js';
import {tineLiveFragment} from '../tine/live-address.js';
const $=id=>document.getElementById(id),canvas=$('instrument'),status=$('scene-status'),buttons=[...document.querySelectorAll('[data-view]')];
const design=createTineDesign();
let world=null,session=null,raf=0,wantsFocus=false,returnFocus=false,liveResponse=null,replayResponse=null,replayCount=0,replayFocus=false;
const active=state=>['preparing','playing','ringing','ending'].includes(state);
const listening=()=>['preparing','playing','suspended'].includes(replay.state);
function controls(){
 const state=session?.state??'idle',busy=active(state),repeat=listening();
 $('begin').disabled=!world||busy||repeat;
 $('touch').disabled=repeat||state!=='playing'||session.touches>=8;
 $('quiet').disabled=(!busy&&!repeat)||(busy&&state==='ending');
 $('again').disabled=!world||busy||repeat||capture.pending||!capture.current;
 $('touch-count').textContent=repeat?`${replayCount} / ${capture.current.record.events.length} remembered ${capture.current.record.events.length===1?'touch':'touches'}`:`${session?.touches??0} / 8 touches`;
}
function touch(){if(!session||$('touch').disabled)return;session.strike(.1).catch(error=>{if(error.name!=='AbortError')$('playing-status').textContent=error.message;});}
function animate(){
 raf=0;const repeat=listening(),t=repeat?replay.time():session.time(),response=repeat?replayResponse:liveResponse;
 if(response&&$('reveal').checked)world?.response(response.at(t).points);
 if(repeat){
  const record=capture.current.record,count=record.events.filter(e=>e.frame/record.sampleRate<=t).length;
  if(count!==replayCount){replayCount=count;world?.acknowledgeTouch(count>0);controls();}
  $('remaining').textContent=`${t.toFixed(1)} / ${capture.current.seconds.toFixed(1)} seconds`;
 }else $('remaining').textContent=t<4?`${Math.max(0,4-t).toFixed(1)} seconds to touch`:'Letting it ring';
 if(active(session.state)||repeat)raf=requestAnimationFrame(animate);
}
function stopView(){cancelAnimationFrame(raf);raf=0;world?.response(null);$('remaining').textContent='Quiet';}
function runView(){if(!raf)raf=requestAnimationFrame(animate);}
try{
 world=createLivingScene(canvas,{onTouch:touch});status.textContent='80 × 10 × 1 mm · drag to look around';
 for(const button of buttons)button.addEventListener('click',()=>{world.view(button.dataset.view);for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));status.textContent=button.textContent;});
}catch(error){status.textContent='The 3D view could not open. The sound sketch and scene boards are available below.';for(const b of buttons)b.disabled=true;console.error(error);}
const capture=createTineLiveCapture({onChange:({current,pending,message})=>{
 if(current){$('open-phrase').href='tine-play.html'+tineLiveFragment(current.record);$('phrase-path').hidden=false;}
 $('phrase-note').textContent=message?`The latest replay could not be prepared. ${current?'Your previous phrase is still available. ':''}${message}`:pending?'Remembering this phrase…':current?`${current.record.events.length} ${current.record.events.length===1?'touch':'touches'} · ${current.seconds.toFixed(2)} seconds. Hear it here, or open it to compare bodies and keep its address.`:'A completed phrase will appear here.';
 controls();
}});
const replay=createGroveReplay({listeningDb:0,onChange:({state})=>{
 const quietFocused=document.activeElement===$('quiet');controls();
 if(state==='preparing')$('playing-status').textContent='Preparing your phrase…';
 if(state==='playing'){$('playing-status').textContent='Your phrase, returning.';if(replayFocus)$('quiet').focus({preventScroll:true});runView();}
 if(state==='suspended'){$('playing-status').textContent='Replay was interrupted. Choose Quiet, then hear it again.';stopView();}
 if(!listening()){stopView();if(state==='ended')$('playing-status').textContent='Your phrase has settled. Hear it again, or begin something new.';if(quietFocused&&replayFocus)$('again').focus({preventScroll:true});replayFocus=false;}
}});
session=createTineLiveSession({listeningDb:0,onChange:event=>{
 const touchFocused=document.activeElement===$('touch'),quietFocused=document.activeElement===$('quiet');
 if(event.state==='ending'&&(touchFocused||quietFocused))returnFocus=true;
 controls();if(event.sampleRate)liveResponse=createLivingResponse(design,event.sampleRate);
 const messages={preparing:'Preparing the instrument…',playing:'Touch the blade, or use the Touch button.',ringing:'The touch window has closed. Let it ring, or choose Quiet.',ending:'Ending gently…',ended:'The phrase has settled. Hear it again, or begin something new.',interrupted:'Playing stopped while the page or audio was away. Begin again when ready.',cancelled:'Preparation cancelled.',error:event.message};
 $('playing-status').textContent=messages[event.state]??'Opening is quiet. Begin when you choose.';
 if(event.event){liveResponse?.accept(event.event);world?.acknowledgeTouch();$('touch-note').textContent=`Touch ${event.touches} accepted at sample ${event.event.frame}. The gold spot marks the fixed touch position; it is not a vibration display.`;}
 if(event.finished?.snapshot.events.length)capture.accept(event.finished).catch(error=>{$('phrase-note').textContent=error.message;});
 if(event.finished&&!event.finished.snapshot.events.length)$('playing-status').textContent='This pass ended without touches.'+(capture.current?' Your previous phrase remains available.':'');
 if(event.state==='playing'&&wantsFocus){wantsFocus=false;$('touch').focus({preventScroll:true});}
 if(touchFocused&&$('touch').disabled&&!$('quiet').disabled)$('quiet').focus({preventScroll:true});
 if(!active(event.state)){stopView();if(touchFocused||quietFocused||returnFocus)$('begin').focus({preventScroll:true});returnFocus=false;}
 else if(event.state==='playing')runView();
}});
$('begin').addEventListener('click',async()=>{
 capture.cancel();replay.park();liveResponse=null;world?.response(null);world?.acknowledgeTouch(false);wantsFocus=true;
 $('touch-note').textContent='Touches join the vibration already ringing. The gold spot appears only after a touch is accepted.';
 document.querySelector('.scene').scrollIntoView({block:'center',behavior:'instant'});
 try{await session.start(design);}catch(error){if(error.name!=='AbortError')$('playing-status').textContent=error.message;}
});
$('again').addEventListener('click',async()=>{
 const pcm=capture.current;if(!pcm||$('again').disabled)return;
 replayResponse=createLivingResponse(pcm.record.design,pcm.sampleRate);pcm.record.events.forEach(event=>replayResponse.accept(event));replayCount=0;
 world?.acknowledgeTouch(false);$('touch-note').textContent='Returning to your original touches, including their timing and ending.';
 document.querySelector('.scene').scrollIntoView({block:'center',behavior:'instant'});
 // play() first emits idle while stopping any old source; set focus intent after that synchronous step.
 const playing=replay.play(pcm);replayFocus=true;
 try{await playing;}catch(error){$('playing-status').textContent=error.message;}
});
$('reveal').addEventListener('change',()=>{if(!$('reveal').checked)world?.response(null);});
$('touch').addEventListener('click',touch);
$('touch').addEventListener('keydown',event=>{if(event.repeat&&(event.code==='Space'||event.code==='Enter'))event.preventDefault();});
$('quiet').addEventListener('click',()=>{
 if(listening()){replay.stop();$('playing-status').textContent='Replay stopped. Your phrase is unchanged.';return;}
 session.quiet().catch(error=>{if(error.name!=='AbortError')$('playing-status').textContent=error.message;});
});
$('level').addEventListener('input',()=>{const db=Number($('level').value);session.setListeningDb(db);replay.setListeningDb(db);$('level-value').textContent=`+${db} dB`;});
function park(){wantsFocus=false;replayFocus=false;capture.cancel();replay.park();session.park();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();park();status.textContent='The 3D view was interrupted. Reload to restore it; the sound sketch remains available.';for(const b of buttons)b.disabled=true;world?.dispose();world=null;controls();});
controls();
