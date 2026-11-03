import {createTineDesign,tineAddressFragment} from './address.js';
import {readTineReturn} from './phrase-address.js';
import {createTineLiveSession} from './live-session.js';
const $=id=>document.getElementById(id);let design=null,raf=0,wantsFocus=false,returnFocus=false;
function controls(state,touches){const active=['preparing','playing','ringing','ending'].includes(state);$('begin').disabled=!design||active;$('quiet').disabled=!active||state==='ending';$('touch').disabled=state!=='playing'||touches>=8;$('count').textContent=`${touches} / 8 touches`;}
function animate(){raf=0;const time=session.time();$('progress').value=time;$('clock').textContent=time<4?`${Math.max(0,4-time).toFixed(1)} s to touch`:'Letting it ring';if(['playing','ringing','ending'].includes(session.state))raf=requestAnimationFrame(animate);}
const session=createTineLiveSession({onChange:event=>{
 const wasTouch=document.activeElement===$('touch'),wasQuiet=document.activeElement===$('quiet');if(event.state==='ending'&&(wasTouch||wasQuiet))returnFocus=true;controls(event.state,event.touches);
 const messages={idle:'Opening is quiet. Begin when you are ready.',preparing:'Preparing the body for touch…',playing:'The body is listening for your touches.',ringing:'The touch window has closed. Let it ring, or choose Quiet.',ending:'Ending gently…',ended:'This pass has ended. Begin another when you choose.',interrupted:'Playing stopped while audio or the page was away. Begin another pass when you return.',cancelled:'Preparation cancelled. Begin when you choose.',error:event.message};
 $('status').textContent=messages[event.state]??event.state;
 if(event.event)$('last-touch').textContent=`Touch ${event.touches} joined the vibration.`;
 if(event.state==='playing'&&wantsFocus&&!$('touch').disabled){wantsFocus=false;$('touch').focus({preventScroll:true});}
 if(wasTouch&&$('touch').disabled&&!$('quiet').disabled)$('quiet').focus({preventScroll:true});
 if(['ended','interrupted','error','cancelled'].includes(event.state)){cancelAnimationFrame(raf);raf=0;$('clock').textContent='Quiet';$('progress').value=session.time();if(wasTouch||wasQuiet||returnFocus)$('begin').focus({preventScroll:true});returnFocus=false;}
 else if(event.state==='playing'&&!raf)raf=requestAnimationFrame(animate);
}});
$('begin').addEventListener('click',async()=>{wantsFocus=document.activeElement===$('begin');$('last-touch').textContent='Touches are counted when the audio processor accepts them.';$('progress').value=0;try{await session.start(design);}catch(error){if(error.name!=='AbortError')$('status').textContent=error.message;}});
$('touch').addEventListener('click',()=>session.strike().catch(error=>{if(error.name!=='AbortError')$('last-touch').textContent=error.message;}));
$('touch').addEventListener('keydown',event=>{if(event.repeat&&(event.code==='Space'||event.code==='Enter'))event.preventDefault();});
$('quiet').addEventListener('click',()=>session.quiet().catch(error=>{if(error.name!=='AbortError')$('status').textContent=error.message;}));
function park(){wantsFocus=false;session.park();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);window.addEventListener('hashchange',()=>location.reload());
try{
 design=readTineReturn(location.hash)?.design??createTineDesign();$('back').href='tine.html'+tineAddressFragment(design);
 $('identity').textContent=`${design.lengthMm} × ${design.widthMm} × 1 mm · strike ${design.activation.toFixed(2)} · pickup ${design.pickup.toFixed(2)}`;
 const svg=$('body'),L=design.lengthMm*5.5,W=design.widthMm*5.5;
 const add=(tag,attrs)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);svg.append(el);};
 add('rect',{x:25,y:20,width:35,height:160,fill:'#64716d'});add('rect',{x:60,y:100-W/2,width:L,height:W,fill:'#bed5c42a',stroke:'#bed5c4','stroke-width':2});
 for(const [u,color,dash] of [[design.activation,'#e2b777','6 4'],[design.pickup,'#90ccd8','none']])add('line',{x1:60+u*L,x2:60+u*L,y1:25,y2:175,stroke:color,'stroke-width':dash==='none'?2:4,'stroke-dasharray':dash});
 controls('idle',0);
}catch(error){design=null;controls('error',0);$('status').textContent=error.message+' Return to Shape the body to choose a valid instrument.';}
