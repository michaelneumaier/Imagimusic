// Offline scale evidence for the existing picture, not a visibility or audio-quality verdict.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {composeEnsemblePhrase} from '../src/score/grove-ensemble.js';
import {visualFromState} from '../src/rest/engine.js';
const sampleRate=48000,out=process.argv[2]??'renders/ensemble-picture-response';
const recipes=[48,51,55].map(note=>createGroveRestRecipe(retuneGroveCluster(composeGrove({seed:3}),note),DEFAULT_VOICE_CONFIG,{sampleRate}));
const phrase=composeEnsemblePhrase(recipes,{together:false,velocity:.5});
const processors={};globalThis.sampleRate=sampleRate;globalThis.currentFrame=0;
globalThis.AudioWorkletProcessor=class{constructor(){this.messages=[];this.port={postMessage:m=>this.messages.push(m)};}};
globalThis.registerProcessor=(name,value)=>{processors[name]=value;};
await import('../src/grove/ensemble-worklet.js');
const processor=new processors['imagimusic-grove-ensemble']({processorOptions:{recipes,generation:'picture-audit',snapshots:true,postAudio:false}});
for(const part of phrase.parts)processor.port.onmessage({data:{type:'events',part:part.index,events:part.commands}});
const peaks=recipes.map(recipe=>Array(recipe.bodies).fill(0)),peakFrames=peaks.map(row=>row.slice());let snapshots=0,refused=0;
const output=[new Float32Array(128),new Float32Array(128)];
for(let frame=0;frame<phrase.endFrame+sampleRate*.025+128;frame+=128){
 globalThis.currentFrame=frame;processor.process([],[output]);
 for(const message of processor.messages.splice(0)){
  if(message.type==='error')throw new Error(message.message);
  if(message.type==='processed')refused+=message.events.filter(e=>!e.accepted).length;
  if(message.type!=='state')continue;snapshots++;
  for(const part of message.parts){
   const response=visualFromState(recipes[part.part],part.state,part.key);
   response.envelope.forEach((value,body)=>{if(value>peaks[part.part][body]){peaks[part.part][body]=value;peakFrames[part.part][body]=message.frame;}});
  }
 }
}
assert.equal(refused,0);assert.ok(snapshots>0);
const report={sampleRate,snapshots,refused,source:'Three Groves authored demonstration: seed3, C3/E-flat3/G3, together:false, velocity0.5',mapping:'Current scene.js: width 1+min(0.2,envelope*0.6); shell emissive 0.025+min(0.7,envelope*2). No auto-normalization.',parts:peaks.map((row,part)=>({part,bodies:row.map((peakEnvelope,body)=>({body,peakEnvelope,peakFrame:peakFrames[part][body],maximumSampledWidthChangePercent:100*Math.min(.2,peakEnvelope*.6),maximumSampledShellEmissiveAddition:Math.min(.7,peakEnvelope*2)}))})),limits:'Offline production snapshots only, not all-sample extrema, physical deformation, screen-pixel measurement, perceived brightness, listening evidence or device performance. Scene mappings are copied here for audit; no production visual scaling is changed.'};
await fs.mkdir(out,{recursive:true});await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
