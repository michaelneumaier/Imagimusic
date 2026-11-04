import {createContinuousEnsembleSession} from './continuous-ensemble-session.js';
export function setupContinuousEnsembleControls({elements,visual=null,beforePlay=()=>{},createSession=createContinuousEnsembleSession,makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url)}){
 const {start,quiet,seed,status,count,result,downloads,whole}=elements;let session,version=0,urls=[];
 const active=()=>['preparing','playing','ending','verifying'].includes(session.state);
 function update(){start.disabled=active();seed.disabled=active();quiet.disabled=!active()||session.state==='ending';quiet.textContent=session.state==='preparing'?'Cancel':session.state==='verifying'?'Cancel keeping':'Quiet';}
 function keep(finished){
  if(finished.records.length!==3)throw Error('The three voice records are unavailable.');
  const next=[];
  try{for(const record of finished.records)next.push(makeURL(new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'})));
   if(whole)next.push(makeURL(new Blob([JSON.stringify({kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:finished.records},null,2)+'\n'],{type:'application/json'})));
  }
  catch(error){next.forEach(revokeURL);throw error;}
  const old=urls;urls=next;
  downloads.forEach((link,i)=>{link.href=urls[i];link.download=`imagimusic-ensemble-${finished.seed}-voice-${i+1}-${finished.records[i].design.lengthMm}mm.json`;link.hidden=false;});
  if(whole){whole.href=urls[3];whole.download=`imagimusic-ensemble-${finished.seed}.json`;whole.hidden=false;}
  result.textContent=`Performance ready · ${(finished.snapshot[0].endFrame/finished.records[0].sampleRate).toFixed(2)} seconds. Keep the whole piece or its individual voices below.`;result.hidden=false;old.forEach(revokeURL);
 }
 session=createSession({listeningDb:0,onChange:event=>{
  visual?.update(event);count.textContent=`${event.touches} accepted ${event.touches===1?'note':'notes'}`;
  const messages={idle:'Three voices, waiting.',preparing:'Preparing the three instruments…',playing:'The piece unfolds on its own. Stay as long as you wish.',ending:'Letting the last sounds settle…',verifying:'Keeping the three voices…',ended:'The last sounds have settled.',interrupted:'Listening stopped. Begin again when you are ready.',cancelled:'Preparation cancelled.',error:event.message||'Listening could not continue.'};status.textContent=messages[event.state]??event.state;
  if(event.finished)try{keep(event.finished);}catch(error){status.textContent=`The piece finished, but its voice downloads could not be prepared: ${error.message}`;}
  update();
 }});
 start.addEventListener('click',async()=>{
  if(active())return;beforePlay();const own=++version;count.textContent='0 accepted notes';
  try{visual?.begin(Number(seed.value));await session.start(Number(seed.value));}catch(error){if(own===version&&error.name!=='AbortError')status.textContent=error.message;}finally{if(own===version)update();}
 });
 function stop(){visual?.stop();version++;if(active())session.park();update();}
 quiet.addEventListener('click',async()=>{if(session.state==='verifying'){stop();return;}try{await session.quiet();}catch(error){if(error.name!=='AbortError')status.textContent=error.message;}update();});
 update();return {stop,time:()=>session.time(),setDb:db=>session.setListeningDb(db),get finished(){return session.finished;},get state(){return session.state;},dispose(){stop();session.dispose();urls.forEach(revokeURL);urls=[];}};
}
