import {parseRestImport} from './rest-import.js';
import {recipeForRecord,bridgeEnergyExchange,adaptGroveByExchange,renderRestRecord} from '../score/grove-rest.js';
import {createRestReplayPicture} from './rest-replay-picture.js';
import {prepareRestVariant} from './rest-variant.js';
export const ADAPTATION_MAX_SECONDS=20,ADAPTATION_MAX_SAMPLE_RATE=48000;
/** One explicit offline comparison. Never changes the supplied file or a live host.
 * This experimental reader is more tightly bounded than ordinary Rest reopening.
 */
export function prepareRestAdaptation(text){
 const record=parseRestImport(text);
 if(record.sampleRate>ADAPTATION_MAX_SAMPLE_RATE||(record.ended.frame+record.ended.fadeFrames)/record.sampleRate>ADAPTATION_MAX_SECONDS)throw new Error('For this experiment, choose a passage up to 20 seconds at 48 kHz or below. Your file is unchanged.');
 const recipe=recipeForRecord(record),exchange=bridgeEnergyExchange(record,recipe),target=adaptGroveByExchange(record.grove,exchange,{k:.5});
 const changed=prepareRestVariant(record,target);
 if(changed.record.outputGain!==record.outputGain)throw new Error('This comparison requires identical output gain settings. Your file is unchanged.');
 return {original:{record,pcm:renderRestRecord(record,recipe),picture:createRestReplayPicture(record,recipe)},changed,exchange,rule:{kind:'bridge-activity-stiffening',k:.5,steps:1},limits:{seconds:ADAPTATION_MAX_SECONDS,sampleRate:ADAPTATION_MAX_SAMPLE_RATE}};
}
