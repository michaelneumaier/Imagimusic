import {scheduledEvents} from '../score/conversation.js';

/** Resolve audible/approaching events to their authoring data; never guess from a slot alone. */
export function inspectScoreEvents(passage,target,time,performer){
 if(!passage.score)return [];
 const authored=scheduledEvents(passage.score),byId=new Map(authored.map(e=>[e.id,e]));
 let rows=[];
 if(target.startsWith('performer/')){
  if(performer?.eventId==null)return [];
  rows=passage.events.filter(e=>e.family===performer.family&&e.voice.id===performer.eventId).map(e=>byId.get(e.voice.scoreId));
 }else{
  const match=/^(garden|tine|bellows|loom)\/slot(\d+)$/.exec(target);
  if(match){
   const family=match[1],slot=Number(match[2]);
   if(family==='loom'){
    const notes=authored.filter(e=>e.family==='loom');
    rows=passage.loom?.events.flatMap((e,i)=>e.body===slot&&time>=e.time-.18&&time<e.end?[notes[i]]:[])??[];
   }else rows=passage.events.filter(e=>e.family===family&&e.voice.slot===slot&&time>=e.voice.noteOn-(family==='bellows'?0:e.voice.approach??.18)&&time<e.voice.end).map(e=>byId.get(e.voice.scoreId));
  }else if(target.startsWith('fm/')&&passage.fm&&time>=passage.fm.time&&time<passage.fm.duration)rows=authored.filter(e=>e.family==='fm');
 }
 return rows.filter(Boolean).map(e=>({id:e.id,section:e.id.split(':')[1],family:e.family,beat:e.beat,...(e.anchor?{anchor:true}:{weight:e.weight})}));
}
