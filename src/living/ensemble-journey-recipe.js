import {createEnsembleJourneyStudy} from './ensemble-journey-study.js';
export const ENSEMBLE_JOURNEY_RECIPE_LIMIT=4096;
export function createEnsembleJourneyRecipe(gesture,wavSha256){
 if(!Array.isArray(gesture)||!/^[a-f0-9]{64}$/.test(wavSha256))throw Error('Invalid personal journey recipe.');
 createEnsembleJourneyStudy(42,{sampleRate:48000,gesture});
 return {kind:'imagimusic-ensemble-journey-recipe',version:1,sampleRate:48000,gesture:gesture.map(({frame,strength})=>({frame,strength})),wavSha256};
}
export function readEnsembleJourneyRecipe(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>ENSEMBLE_JOURNEY_RECIPE_LIMIT)throw Error('Choose a journey recipe no larger than 4 KiB.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The journey recipe is not valid JSON.');}
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==5||!['kind','version','sampleRate','gesture','wavSha256'].every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-ensemble-journey-recipe'||value.version!==1||value.sampleRate!==48000)throw Error('Unsupported journey recipe.');
 return createEnsembleJourneyRecipe(value.gesture,value.wavSha256);
}
