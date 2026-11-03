import {tineFloatWav} from './wav.js';
import {createTineDesign,tineAddressFragment} from './address.js';
import {readTineReturn} from './phrase-address.js';
import {createTineLiveSession} from './live-session.js';
import {readTineLiveAddress,tineLiveFragment} from './live-address.js';
import {createTineLiveCapture} from './live-capture.js';
import {createTineComparisonSession} from './live-comparison-session.js';
import {createTineLiveResponseView} from './live-response-view.js';
import {createGroveReplay} from '../grove/replay.js';
const $=id=>document.getElementById(id);let design=null,raf=0,wantsFocus=false,returnFocus=false;
const spatial=createTineLiveResponseView({details:$('spatial-inspection'),svg:$('spatial-picture'),selector:$('spatial-source'),slider:$('spatial-frame'),previous:$('spatial-previous'),next:$('spatial-next'),caption:$('spatial-caption'),reading:$('spatial-reading'),zoom:$('spatial-zoom'),scale:$('spatial-scale')});
const liveActive=state=>['preparing','playing','ringing','ending'].includes(state);
const replayActive=()=>['preparing','playing','suspended'].includes(replay.state);
function controls(state,touches){const active=liveActive(state),listening=replayActive();$('begin').disabled=!design||active||listening;$('quiet').disabled=(!active&&!listening)||(active&&state==='ending');$('touch').disabled=state!=='playing'||touches>=8;$('touch-strength').disabled=!design||listening||(active&&state!=='playing');$('count').textContent=`${touches} / 8 touches`;$('replay').disabled=active||listening||capture.pending||!capture.current;$('keep-pass').disabled=active||!capture.current;$('download-pass').disabled=active||capture.pending||!capture.current;
 const blocked=active||listening||capture.pending||comparison.pending;
 $('prepare-comparison').disabled=blocked||!capture.current;
 for(const id of ['compare-length','compare-width'])$(id).disabled=blocked||!capture.current;
 for(const id of ['listen-original','listen-candidate'])$(id).disabled=blocked||!comparison.current;
}
let comparisonSource=null;
const bodyName=record=>`${record.design.lengthMm} × ${record.design.widthMm} mm`;
function showTouchReading(pcm){
 const record=pcm.record,rows=record.events.map((event,index)=>{
  const row=document.createElement('tr');
  const name=new Map([[.025,'Soft'],[.05,'Light'],[.1,'Firm']]).get(event.strength);
  for(const text of [String(index+1),`${(event.frame/record.sampleRate).toFixed(3)} s`,`${name?name+' · ':''}${event.strength}`]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
  return row;
 });
 $('touch-rows').replaceChildren(...rows);$('touch-table').hidden=false;
 $('touch-reading-note').textContent=`${bodyName(record)} · ${record.events.length} ${record.events.length===1?'touch':'touches'} · ${pcm.seconds.toFixed(2)}-second completed pass. These are the original touches used by replay and body comparison.`;
}
function showCapture({current,pending,message}){
 if(current&&current!==comparisonSource){showTouchReading(current);comparisonSource=current;for(const key of ['length','width'])$('compare-'+key).value=current.record.design[key+'Mm'];showDraft();comparison.setSource(current.record);}
 $('capture-note').textContent=message?`The latest pass could not be prepared. ${current?'The previous pass is still available. ':''}${message}`:pending?`Preparing this pass quietly…${current?' The previous completed pass remains available.':''}`:current?`${current.record.events.length} ${current.record.events.length===1?'touch':'touches'} · ${current.seconds.toFixed(2)} seconds · ready to replay. A new completed pass with touches replaces this replay; the address changes only when you choose Keep.`:'A completed pass with touches will appear here. Use Keep this pass to put it in the address before leaving.';
 controls(session.state,session.touches);
}
const capture=createTineLiveCapture({onChange:showCapture});
const comparison=createTineComparisonSession({onChange:({current,pending,message})=>{
 spatial.setSources(capture.current?.record??null,current?.candidate.record??null);
 $('candidate-path').hidden=!current;if(current){$('play-candidate').href='tine-play.html'+tineAddressFragment(current.candidate.record.design);$('play-candidate').textContent='Play this prepared body: '+bodyName(current.candidate.record)+' ↗';}
 $('comparison-note').textContent=message?`Comparison could not be prepared. ${current?'The previous pair remains available. ':''}${message}`:pending?'Preparing both bodies quietly…':current?`Prepared original: ${bodyName(current.original.record)}. Changed body: ${bodyName(current.candidate.record)}. Same ${current.original.record.events.length} ${current.original.record.events.length===1?'touch':'touches'} and ${current.original.seconds.toFixed(2)}-second ending.`:'Choose dimensions, then prepare. The original pass stays intact.';
 controls(session.state,session.touches);
}});
let replayFocus=false,replayButton='replay',replayLabel='the completed pass';
const replay=createGroveReplay({listeningDb:0,onChange:({state})=>{
 const quietFocused=document.activeElement===$('quiet');
 controls(session.state,session.touches);
 if(state==='preparing')$('status').textContent='Preparing to replay the completed pass…';
 if(state==='playing'){$('status').textContent=`Replaying ${replayLabel}, including its ending.`;if(replayFocus)$('quiet').focus({preventScroll:true});}
 if(state==='suspended')$('status').textContent='Replay is interrupted. Choose Quiet, then replay again.';
 if(state==='ended'){$('status').textContent='Replay ended. Listen again, or begin a new pass.';if(quietFocused)$(replayButton).focus({preventScroll:true});replayFocus=false;}
}});

function animate(){raf=0;const time=session.time();$('progress').value=time;$('clock').textContent=time<4?`${Math.max(0,4-time).toFixed(1)} s to touch`:'Letting it ring';if(['playing','ringing','ending'].includes(session.state))raf=requestAnimationFrame(animate);}
const session=createTineLiveSession({listeningDb:0,onChange:event=>{
 const wasTouch=document.activeElement===$('touch'),wasQuiet=document.activeElement===$('quiet');if(event.state==='ending'&&(wasTouch||wasQuiet))returnFocus=true;controls(event.state,event.touches);
 const messages={idle:'Opening is quiet. Begin when you are ready.',preparing:'Preparing the body for touch…',playing:'The body is listening for your touches.',ringing:'The touch window has closed. Let it ring, or choose Quiet.',ending:'Ending gently…',ended:'This pass has ended. Begin another when you choose.',interrupted:'Playing stopped while audio or the page was away. Begin another pass when you return.',cancelled:'Preparation cancelled. Begin when you choose.',error:event.message};
 $('status').textContent=messages[event.state]??event.state;
 if(event.finished&&!event.finished.snapshot.events.length)$('status').textContent='This pass ended without touches.'+(capture.current?' The previous completed pass is still available.':' Begin another when you choose.');
 if(event.finished&&event.finished.snapshot.events.length)capture.accept(event.finished).catch(error=>showCapture({current:capture.current,message:error.message}));
 if(event.event)$('last-touch').textContent=`Touch ${event.touches} joined the vibration · ${event.event.strength} micro-newton second.`;
 if(event.state==='playing'&&wantsFocus&&!$('touch').disabled){wantsFocus=false;$('touch').focus({preventScroll:true});}
 if(wasTouch&&$('touch').disabled&&!$('quiet').disabled)$('quiet').focus({preventScroll:true});
 if(['ended','interrupted','error','cancelled'].includes(event.state)){cancelAnimationFrame(raf);raf=0;$('clock').textContent='Quiet';$('progress').value=session.time();if(wasTouch||wasQuiet||returnFocus)$('begin').focus({preventScroll:true});returnFocus=false;}
 else if(event.state==='playing'&&!raf)raf=requestAnimationFrame(animate);
}});
$('listening-level').addEventListener('input',()=>{
 const db=Number($('listening-level').value);session.setListeningDb(db);replay.setListeningDb(db);
 $('listening-value').textContent=`+${db} dB`;
});
$('begin').addEventListener('click',async()=>{$('touch').scrollIntoView({block:'center',behavior:'instant'});comparison.cancel();capture.cancel();replay.park();wantsFocus=document.activeElement===$('begin');$('last-touch').textContent='Touches are counted when the audio processor accepts them.';$('progress').value=0;try{await session.start(design);}catch(error){if(error.name!=='AbortError')$('status').textContent=error.message;}});
$('touch').addEventListener('click',()=>session.strike(Number($('touch-strength').value)).catch(error=>{if(error.name!=='AbortError')$('last-touch').textContent=error.message;}));
$('touch').addEventListener('keydown',event=>{
 if(event.repeat&&(event.code==='Space'||event.code==='Enter'))event.preventDefault();
 const strength={'1':.025,'2':.05,'3':.1}[event.key];
 if(strength===undefined||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||$('touch').disabled)return;
 event.preventDefault();if(event.repeat)return;
 $('touch-strength').value=String(strength);$('touch').click();
});
$('keep-pass').addEventListener('click',()=>{if(!capture.current)return;try{const pcm=capture.current;history.replaceState(null,'',location.pathname+location.search+tineLiveFragment(pcm.record));$('keep-note').textContent=`Address now keeps ${pcm.record.events.length} ${pcm.record.events.length===1?'touch':'touches'} and the ${pcm.seconds.toFixed(2)}-second ending with this body. Bookmark or copy it for a quiet return. New playing does not change this address.`;}catch(error){$('keep-note').textContent=error.message;}});
async function listen(pcm,button,label){if(!pcm)return;replayButton=button;replayLabel=label;replayFocus=document.activeElement===$(button);try{await replay.play(pcm);}catch(error){$('status').textContent=error.message;}}
$('download-pass').addEventListener('click',()=>{
 const pcm=capture.current;if(!pcm||capture.pending||liveActive(session.state))return;
 try{const url=URL.createObjectURL(new Blob([tineFloatWav(pcm)],{type:'audio/wav'})),link=document.createElement('a');
 link.href=url;link.download=`imagimusic-tine-${pcm.record.design.lengthMm}x${pcm.record.design.widthMm}-${pcm.frames}frames.wav`;
 document.body.append(link);try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 $('download-note').textContent=`WAV download requested: original completed pass, ${pcm.seconds.toFixed(2)} seconds, ${pcm.sampleRate} Hz, mono 32-bit float. Fixed source level; no normalization. Keep the address separately to return to the playable recipe.`;
 }catch(error){$('download-note').textContent=`Download could not be prepared. ${error.message}`;}
});
$('replay').addEventListener('click',()=>listen(capture.current,'replay','the completed pass'));
$('listen-original').addEventListener('click',()=>listen(comparison.current?.original,'listen-original','the original body: '+bodyName(comparison.current.original.record)));
$('listen-candidate').addEventListener('click',()=>listen(comparison.current?.candidate,'listen-candidate','the changed body: '+bodyName(comparison.current.candidate.record)));
function showDraft(){for(const key of ['length','width'])$('compare-'+key+'-value').textContent=$('compare-'+key).value+' mm';$('comparison-draft').textContent='Dimensions are staged; prepared listening stays unchanged until preparation succeeds.';}
for(const key of ['length','width'])$('compare-'+key).addEventListener('input',showDraft);
$('prepare-comparison').addEventListener('click',async()=>{const focused=document.activeElement===$('prepare-comparison');try{await comparison.prepare({lengthMm:Number($('compare-length').value),widthMm:Number($('compare-width').value)});}catch(error){$('comparison-note').textContent=error.message;}if(focused&&!document.hidden&&!$('prepare-comparison').disabled)$('prepare-comparison').focus({preventScroll:true});});
$('quiet').addEventListener('click',()=>{if(replayActive()){const focused=document.activeElement===$('quiet');replay.stop();$('status').textContent='Replay stopped. The completed pass is unchanged.';if(focused)$(replayButton).focus({preventScroll:true});return;}session.quiet().catch(error=>{if(error.name!=='AbortError')$('status').textContent=error.message;});});
function park(){wantsFocus=false;replayFocus=false;comparison.cancel();capture.cancel();replay.park();session.park();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);window.addEventListener('hashchange',()=>location.reload());
try{
 const kept=location.hash.startsWith('#tine-live=')?readTineLiveAddress(location.hash):null;
 design=kept?.design??readTineReturn(location.hash)?.design??createTineDesign();$('back').href='tine.html'+tineAddressFragment(design);
 $('identity').textContent=`${design.lengthMm} × ${design.widthMm} × 1 mm · strike ${design.activation.toFixed(2)} · pickup ${design.pickup.toFixed(2)}`;
 const svg=$('body'),L=design.lengthMm*5.5,W=design.widthMm*5.5;
 const add=(tag,attrs)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);svg.append(el);};
 add('rect',{x:25,y:20,width:35,height:160,fill:'#64716d'});add('rect',{x:60,y:100-W/2,width:L,height:W,fill:'#bed5c42a',stroke:'#bed5c4','stroke-width':2});
 for(const [u,color,dash] of [[design.activation,'#e2b777','6 4'],[design.pickup,'#90ccd8','none']])add('line',{x1:60+u*L,x2:60+u*L,y1:25,y2:175,stroke:color,'stroke-width':dash==='none'?2:4,'stroke-dasharray':dash});
 controls('idle',0);
 if(kept){$('keep-note').textContent='This address carries a kept pass. It opens quietly; choose Replay when ready. New playing does not change the address.';capture.load(kept).catch(error=>{$('keep-note').textContent=error.message;});}
}catch(error){design=null;controls('error',0);$('status').textContent=error.message+' Return to Shape the body to choose a valid instrument.';}
