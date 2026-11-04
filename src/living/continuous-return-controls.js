import {createContinuousReturnSession} from './continuous-return-session.js';
export function setupContinuousReturnControls({elements,createSession=createContinuousReturnSession,makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),onChange=()=>{},beforePlay=()=>{},visual=null}){
 const {start,quiet,pad,strength,seed,status,count,download,result}=elements;let session,pending=false,url=null,notes=0,guests=0,version=0;
 const active=()=>['preparing','playing','ending','verifying'].includes(session.state);
 function update(){
  start.disabled=active();seed.disabled=active();pad.disabled=session.state!=='playing'||pending;
  quiet.disabled=!active()||session.state==='ending';quiet.textContent=session.state==='preparing'?'Cancel':session.state==='verifying'?'Cancel keeping':'Quiet';
  count.textContent=`${notes} ${notes===1?'note':'notes'} · ${guests} from you`;onChange({state:session.state});
 }
 function keep(finished){
  const next=makeURL(new Blob([JSON.stringify(finished.record,null,2)+'\n'],{type:'application/json'})),old=url;url=next;
  download.href=next;download.download=`imagimusic-continuous-${finished.seed}.json`;download.hidden=false;
  result.textContent=`Kept performance · ${(finished.snapshot.endFrame/finished.record.sampleRate).toFixed(2)} seconds · ${finished.record.events.length} touches. This JSON contains the instrument and accepted notes.`;result.hidden=false;if(old)revokeURL(old);
 }
 session=createSession({listeningDb:0,onChange:event=>{
  visual?.update(event);
  if(event.events)for(const touch of event.events){if(touch.origin==='guest')guests++;else notes++;}
  const messages={idle:'A small idea, waiting.',preparing:'Preparing your instrument…',playing:'The music continues on its own. Join only if you feel like it.',ending:'Letting the last sound settle…',verifying:'Keeping the performance…',ended:'The last sound has settled.',interrupted:'Listening stopped. Start again when you are ready.',cancelled:'Preparation cancelled.',error:event.message||'Listening could not continue.'};
  status.textContent=messages[event.state]??event.state;
  if(event.finished)try{keep(event.finished);}catch(error){status.textContent=`The performance finished, but its download could not be prepared: ${error.message}`;}
  update();
 }});
 start.addEventListener('click',async()=>{
  if(active())return;beforePlay();const current=++version;notes=0;guests=0;pending=false;
  try{visual?.begin(Number(seed.value));await session.start(Number(seed.value));}catch(error){if(current===version&&error.name!=='AbortError')status.textContent=error.message;}finally{if(current===version)update();}
 });
 async function strike(value){
  if(pad.disabled)return;pending=true;update();const current=version;
  try{await session.strike(value);}catch(error){if(current===version&&error.name!=='AbortError')status.textContent=error.message;}finally{if(current===version){pending=false;update();}}
 }
 pad.addEventListener('click',()=>strike(Number(strength.value)));
 pad.addEventListener('keydown',event=>{if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;const value={'1':.025,'2':.05,'3':.1}[event.key];if(value){event.preventDefault();return strike(value);}});
 async function hush(){if(session.state==='verifying'){stop();return;}try{await session.quiet();}catch(error){if(error.name!=='AbortError')status.textContent=error.message;}update();}
 quiet.addEventListener('click',hush);
 function stop(){visual?.stop();version++;pending=false;if(active())session.park();update();}
 update();return {stop,quiet:hush,setDb:db=>session.setListeningDb(db),time:()=>session.time(),get state(){return session.state;},get finished(){return session.finished;},dispose(){stop();session.dispose();if(url)revokeURL(url);url=null;}};
}
