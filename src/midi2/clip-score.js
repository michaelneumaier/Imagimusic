import {parseMIDIClip} from './clip.js';
import {canonicalExpressionScore,evaluateExpression} from './expression.js';
import {EXPRESSION_LIMITS} from '../expressive/performance.js';

/** Local receiver policy, not a general MIDI Clip player. Preserve setup time
 * for the evaluator; consumers must use origin/end when preparing playback.
 * Unknown packets stay in the report and never acquire invented addresses.
 */
export function importClipScore(bytes,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Clip import options must be an object.');
 for(const key of Object.keys(options))if(key!=='name')throw new Error(`Unknown Clip import option: ${key}`);
 const {name='MIDI Clip'}=options;
 if(typeof name!=='string'||name.length>120)throw new Error('Clip name must be a string of at most120 characters.');
 const clip=parseMIDIClip(bytes);
 if(clip.end.seconds>EXPRESSION_LIMITS.lastEventSeconds)throw new Error('The entire Clip, including configuration and ending silence, must fit within30 seconds.');
 const events=[],configuration=[];
 const append=(packet,setup)=>{
  const message=packet.message;
  if(message.kind!=='midi2')return;
  if(setup&&!['controlChange','registeredController','pitchBend'].includes(message.event.type))throw new Error(`Note-specific configuration is unsupported by this receiver: ${message.event.type} at byte ${packet.byteOffset}.`);
  const event={...message.event,order:events.length,time:packet.seconds};
  events.push(event);
  if(setup)configuration.push({byteOffset:packet.byteOffset,time:packet.seconds,eventOrder:event.order,type:event.type});
 };
 for(const p of clip.configuration)append(p,true);
 for(const p of clip.sequence)append(p,false);
 const score=JSON.parse(canonicalExpressionScore({version:1,protocol:'midi2',source:{kind:'clip',name},events,
  bounds:{maxVoices:EXPRESSION_LIMITS.voices,maxEvents:EXPRESSION_LIMITS.events},
  mapping:{version:1,instrument:'bellows',smoothingSeconds:.005,neutral:{brightness32:0x80000000,timbre32:0x80000000}}}));
 const evaluated=evaluateExpression(score,clip.end.seconds);
 if(!evaluated.voices.length)throw new Error('This receiver needs at least one MIDI2 Note On in the Clip sequence.');
 if(evaluated.voices.some(v=>v.effectiveNoteOff===null))throw new Error('Release every note and the sustain pedal before End of Clip.');
 return {score,origin:clip.origin,end:clip.end,durationSeconds:clip.durationSeconds,
  report:{...clip.report,configuration,evaluator:evaluated.reported,
   interpretation:'Native MIDI2 events mapped to the existing Bellows synthesizer. Configuration keeps its source time; unsupported messages are retained and reported, not applied.',
   playback:'Not rendered. Preserve source ending silence and release tails; omit setup only after receiver preparation at the declared origin.'}};
}
