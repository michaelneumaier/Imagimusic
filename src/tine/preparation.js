import {renderTineImpulse} from './render.js';
import {renderTinePhrase} from './phrase.js';
import {tineTimingPhrase} from './timing.js';

/** Pure worker entry: all requested comparison members finish before a result
 * is returned. A refusal never produces a partially updated pair.
 */
export function prepareTineRequest(data){
 if(!data||typeof data!=='object')throw Error('Unsupported tine preparation request.');
 if(data.kind==='phrase-pair'){
  if(!Array.isArray(data.bodies)||data.bodies.length<1||data.bodies.length>2)throw Error('A phrase comparison needs one or two bodies.');
  const pattern=tineTimingPhrase(data.timing);
  const phrases=data.bodies.map(body=>{
   if(!body||typeof body!=='object')throw Error('A phrase body is required.');
   return renderTinePhrase(body.geometry,{...body.options,events:pattern.events,seconds:pattern.seconds});
  });
  return {timing:pattern.timing,phrases};
 }
 if(data.kind!==undefined&&data.kind!=='body')throw Error('Unsupported tine preparation kind.');
 const single=renderTineImpulse(data.geometry,data.options);
 if(data.kind===undefined)return single;
 const pattern=tineTimingPhrase(data.timing);
 const phrase=renderTinePhrase(data.geometry,{...data.options,events:pattern.events,seconds:pattern.seconds});
 return {single,phrase};
}
export function tineTransferBuffers(result){
 const renders=result.phrases??(result.single?[result.single,result.phrase]:[result]);
 return renders.flatMap(render=>render.channels.map(channel=>channel.buffer));
}
