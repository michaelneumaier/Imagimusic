import {createRestCapture} from './contact-capture.js';
import {validateRestRecord} from '../score/grove-rest.js';

/** Convert completed diagnostic acknowledgements to three canonical Rest records
 * on one origin. Never substitute the requested score for processed decisions.
 * This is a bounded completed-capture adapter, not a live ensemble host. */
export function ensemblePartsFromAcknowledgements(recipes,{generation,acknowledgements,finished}){
 if(!Array.isArray(recipes)||recipes.length!==3||!Array.isArray(acknowledgements)||acknowledgements.length!==3)throw new Error('Ensemble capture needs exactly three parts');
 if(!finished||finished.type!=='finished'||finished.generation!==generation||!Number.isSafeInteger(finished.origin)||finished.origin<0)throw new Error('Missing or invalid ensemble completion');
 if(!finished.ended||!Number.isSafeInteger(finished.ended.frame)||!Number.isSafeInteger(finished.ended.fadeFrames)||finished.ended.fadeFrames<1||finished.frame!==finished.ended.frame+finished.ended.fadeFrames)throw new Error('Invalid ensemble ending');
 if(recipes.some(recipe=>recipe.sampleRate!==recipes[0].sampleRate))throw new Error('Ensemble rates differ');
 let origin=Infinity;
 const captures=recipes.map(recipe=>createRestCapture(recipe,{generation}));
 acknowledgements.forEach((events,part)=>{
  if(!Array.isArray(events)||events.length>4097)throw new Error('Invalid or excessive acknowledgement list');
  captures[part].consume({type:'processed',generation,events});
  for(const ack of events)if(ack.accepted&&(ack.event.kind==='strike'||(ack.event.kind==='contact'&&ack.event.zone!==null)))origin=Math.min(origin,ack.appliedFrame);
 });
 if(!Number.isFinite(origin)||origin!==finished.origin)throw new Error('Ensemble origin differs from the first effective accepted gesture');
 if(!Array.isArray(finished.parts)||finished.parts.length!==3)throw new Error('Missing per-part completion evidence');
 const ended={frame:finished.ended.frame-origin,fadeFrames:finished.ended.fadeFrames};
 const parts=captures.map((capture,part)=>{
  const proof=finished.parts[part],events=acknowledgements[part];
  if(proof.part!==part||proof.ended?.frame!==finished.ended.frame||proof.ended?.fadeFrames!==finished.ended.fadeFrames||proof.accepted!==events.filter(event=>event.accepted).length||proof.refused!==events.filter(event=>!event.accepted).length)throw new Error('Part completion contradicts the acknowledgements');
  capture.consume({type:'finished',generation,frame:finished.frame,ended:finished.ended});
  const record=capture.snapshot({allowSilent:true}),offset=capture.originFrame-origin;
  if(!Number.isSafeInteger(offset)||offset<0)throw new Error('Invalid part origin');
  record.events.forEach(event=>{event.frame+=offset;});
  record.contacts.forEach(contact=>{contact.start+=offset;contact.end+=offset;});
  record.ended.frame+=offset;
  if(record.ended.frame!==ended.frame)throw new Error('Part ending differs from common ending');
  validateRestRecord(record,recipes[part]);
  return record;
 });
 return {sampleRate:recipes[0].sampleRate,originFrame:origin,parts,ended};
}
