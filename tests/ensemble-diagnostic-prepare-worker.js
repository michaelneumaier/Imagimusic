import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,renderRestRecord} from '../src/score/grove-rest.js';
import {composeEnsemblePhrase,ensembleRecords} from '../src/score/grove-ensemble.js';
self.onmessage=({data})=>{
 try{
  const sampleRate=data.sampleRate,source=composeGrove({seed:3});
  const recipes=[48,51,55].map(note=>createGroveRestRecipe(retuneGroveCluster(source,note),DEFAULT_VOICE_CONFIG,{sampleRate}));
  const phrase=composeEnsemblePhrase(recipes),records=ensembleRecords(recipes,phrase);
  const parts=records.map((record,i)=>renderRestRecord(record,recipes[i]));
  const frames=parts[0].channels[0].length,reference=[new Float32Array(frames),new Float32Array(frames)];
  for(let ch=0;ch<2;ch++)for(let frame=0;frame<frames;frame++)reference[ch][frame]=parts.reduce((sum,part)=>sum+part.channels[ch][frame]*(1/3),0);
  self.postMessage({recipes,commands:phrase.parts.map(part=>part.commands),records,frames,reference},reference.map(channel=>channel.buffer));
 }catch(error){self.postMessage({error:error.message});}
};
