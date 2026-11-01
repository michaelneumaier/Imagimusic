import {canonicalGrove} from '../score/grove.js';
import {createGroveRestRecipe,recipeForRecord,transposeRestRecord,renderRestRecord} from '../score/grove-rest.js';
import {createRestReplayPicture} from './rest-replay-picture.js';

/** Audition an explicitly supplied structure with exactly the saved gestures.
 * Unlike exploratory cross-grove transposition, any dropped strike refuses the pair.
 * Each structure retains its canonical model gain; no independent loudness normalization.
 * This adapter never chooses an adaptation rule or replaces the original capture.
 */
export function prepareRestVariant(sourceRecord,targetGrove,{fps=60}={}){
 const source=recipeForRecord(sourceRecord),sourceIdentity=canonicalGrove(source.grove),targetIdentity=canonicalGrove(targetGrove);
 if(sourceIdentity===targetIdentity)throw new Error('This structure is unchanged.');
 if(!sourceRecord.events.length)throw new Error('Play at least one strike before comparing structures.');
 // Snapshot target as well as source before handing ownership to the caller.
 const target=createGroveRestRecipe(JSON.parse(targetIdentity),source.voice,{sampleRate:source.sampleRate,zones:source.zones,strengths:Object.fromEntries(source.strengths.map(({name,c})=>[name,c]))});
 const result=transposeRestRecord(sourceRecord,source,target);
 if(!result.complete)throw new Error('This structure cannot carry every saved strike. Your original passage is unchanged.');
 return {sourceIdentity,targetIdentity,record:result.record,pcm:renderRestRecord(result.record,target),picture:createRestReplayPicture(result.record,target,{fps}),gainPolicy:'canonical-model-gain'};
}
