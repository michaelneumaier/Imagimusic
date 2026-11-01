import {composeGrove,GROVE_SEEDS} from '../score/grove.js';
import {createGroveRestRecipe,recipeForRecord,transposeRestRecord,renderRestRecord} from '../score/grove-rest.js';
import {createRestReplayPicture} from './rest-replay-picture.js';

/** Reinterpret a finished passage on an explicitly chosen grove. The source remains untouched. */
export function prepareRestComparison(sourceRecord,targetSeed,{fps=60}={}){
 if(!GROVE_SEEDS.includes(targetSeed))throw new Error('Choose one of the available groves.');
 if(targetSeed===sourceRecord.grove.seed)throw new Error('Choose a different grove for the comparison.');
 const source=recipeForRecord(sourceRecord);
 if(!sourceRecord.events.length)throw new Error('Play a passage with at least one strike before comparing groves.');
 const target=createGroveRestRecipe(composeGrove({seed:targetSeed}),source.voice,{
  sampleRate:source.sampleRate,zones:source.zones,
  strengths:Object.fromEntries(source.strengths.map(({name,c})=>[name,c])),
 });
 const transposition=transposeRestRecord(sourceRecord,source,target),{record,kept}=transposition;
 const result={...transposition,sourceSeed:source.grove.seed,targetSeed,available:kept>0};
 // A silent comparison must not present itself as a complete replay of the player's gestures.
 if(!kept)return {...result,pcm:null,picture:null};
 return {...result,pcm:renderRestRecord(record,target),picture:createRestReplayPicture(record,target,{fps})};
}
