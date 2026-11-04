import {livingPersonalJourneyHref} from './personal-journey-input.js';
import {createLivingSharedPhraseSession} from './shared-phrase-session.js';
import {createListeningLevel} from '../grove/listening-level.js';
import {tineLiveFragment} from '../tine/live-address.js';

/** Mono worklet upmixes to both speakers: match the centered journey opening.
 * Float live output is not the quantized PCM16 kept soundtrack.
 */
export function createSharedPhraseListeningStage(context,options){
 const level=createListeningLevel(context,options),input=context.createGain();input.gain.value=8/Math.sqrt(2);
 try{input.connect(level.input);}catch(error){input.disconnect();level.dispose();throw error;}
 return {input,output:level.output,setDb:db=>level.setDb(db),dispose(){input.disconnect();level.dispose();}};
}
export function setupSharedPhraseControls({getSource,beforePlay,onChange=()=>{},elements,
 createSession=createLivingSharedPhraseSession,makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),createItem=()=>document.createElement('li'),
}){
 const {start,pad,strength,quiet,status,history,download,replay,develop,result}=elements;
 let session,quota=0,pending=0,version=0,currentURL=null;
 const active=()=>['preparing','playing','ringing','ending'].includes(session.state);
 function update(){start.disabled=active();pad.disabled=session.state!=='playing'||session.touches+pending>=quota;quiet.disabled=!active();onChange();}
 function keep(finished){
  const href='tine-play.html'+tineLiveFragment(finished.record);
  let journeyHref=null,journeyNote='';
  if(!finished.record.events.length)journeyNote=' This ending has no touches to develop into a journey.';
  else try{journeyHref=livingPersonalJourneyHref(finished.record);}catch(error){journeyNote=` This combined phrase can be kept and replayed, but cannot seed a journey: ${error.message}`;}
  const next=makeURL(new Blob([JSON.stringify(finished.record,null,2)+'\n'],{type:'application/json'}));
  const previous=currentURL;currentURL=next;download.href=next;replay.href=href;
  result.hidden=false;result.textContent=`Last completed shared phrase: ${finished.record.events.length} touches, including ${finished.snapshot.guestTouches} from you. The kept record contains the combined performance; your original journey stays selected.`+journeyNote;
  develop.hidden=!journeyHref;if(journeyHref)develop.href=journeyHref;else develop.removeAttribute('href');
  download.hidden=replay.hidden=false;if(previous)revokeURL(previous);
 }
 session=createSession({listeningDb:0,createListeningStage:createSharedPhraseListeningStage,onChange:event=>{
  if(event.events)for(const touch of event.events){const item=createItem();item.textContent=`${touch.origin==='score'?'Phrase':'You'} · ${(touch.frame/getSource().sampleRate).toFixed(3)} s · ${touch.strength===.1?'firm':touch.strength===.05?'light':touch.strength===.025?'soft':touch.strength.toFixed(3)}`;history.append(item);}
  const messages={preparing:'Opening the shared instrument…',playing:`The phrase is playing. You may add up to ${quota} touches while its input window is open.`,ringing:'The touch window has closed. Let the body ring.',ending:'Letting the ending settle…',ended:'The shared phrase has settled.',cancelled:'Preparation cancelled.',interrupted:'The shared instrument stopped. The last completed phrase remains available.',error:event.message||'The shared instrument could not continue.'};
  status.textContent=messages[event.state]??'Ready to listen and join.';
  if(event.finished)try{keep(event.finished);}catch(error){status.textContent=`The phrase finished, but its keep link could not be prepared: ${error.message}`;}
  update();
 }});
 start.addEventListener('click',async()=>{
  beforePlay();const own=++version;pending=0;history.replaceChildren();
  const source=getSource();quota=Math.min(3,8-source.events.length);
  try{await session.start(source,{guestLimit:quota});if(own!==version)return;if(!pad.disabled)pad.focus({preventScroll:true});}
  catch(error){if(own===version&&error.name!=='AbortError')status.textContent=`The shared phrase could not start: ${error.message}`;}finally{if(own===version)update();}
 });
 async function strike(value){
  if(pad.disabled)return;const own=version;pending++;update();
  try{await session.strike(value);}catch(error){if(own===version)status.textContent=error.message;}finally{if(own===version){pending--;update();}}
 }
 pad.addEventListener('click',()=>strike(Number(strength.value)));
 pad.addEventListener('keydown',event=>{if(event.repeat||event.altKey||event.ctrlKey||event.metaKey)return;const value={'1':.025,'2':.05,'3':.1}[event.key];if(value){event.preventDefault();strike(value);}});
 async function end(){try{await session.quiet();}catch(error){status.textContent=error.message;}update();}
 quiet.addEventListener('click',end);
 function stop(){version++;pending=0;if(active())session.park();update();}
 status.textContent='Ready to listen and join. Playing is optional.';update();
 return {stop,quiet:end,setDb:db=>session.setListeningDb(db),get active(){return active();}};
}
