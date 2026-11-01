import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {composeEnsemblePhrase,ensembleRecords} from '../src/score/grove-ensemble.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,validateRestAdmission,renderRestRecord} from '../src/score/grove-rest.js';
import {stereoWav} from '../src/loom/model.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';

const out=process.argv[2]??'renders/harmonic-groves',sampleRate=48000,mixGain=1/3,source=composeGrove({seed:3});
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const report={version:1,sampleRate,mixGain,sourceSeed:3,mixArithmetic:"Read Float32 part PCM; accumulate part samples times (1/3) in JavaScript Float64, then round the final sum once into Float32 before stereoWav PCM16 conversion.",cases:[],score:null,limits:'Three independent physical Groves, not a single connected nine-body network. Each cluster preserves internal cents, masses, loss, layout and coupling fractions; whole-cluster base tuning changes and derived physical recipes/pickup calibration are rebuilt. No playback-rate shift. Each admitted canonical stereo output is multiplied by 1/3 and summed, without normalization or limiting. Same gesture histories and ending in both arrangements. Nominal bases describe tuning, not exact coupled-mode pitches. No listening or appeal verdict.'};
await fs.mkdir(out,{recursive:true});
for(const [name,notes] of [['shared-center',[48,48,48]],['three-centers',[48,51,55]]]){
 const recipes=notes.map(note=>createGroveRestRecipe(retuneGroveCluster(source,note),DEFAULT_VOICE_CONFIG,{sampleRate}));
 const phrase=composeEnsemblePhrase(recipes),records=ensembleRecords(recipes,phrase);
 if(report.score)assert.deepEqual(phrase.parts,report.score);else report.score=phrase.parts;
 const samples=phrase.endFrame+records[0].ended.fadeFrames;
 const parts=[],mixed=[new Float32Array(samples),new Float32Array(samples)],sources=[];
 for(let part=0;part<3;part++){
  const recipe=recipes[part];
  assert.equal(recipe.outputGain,.45,'this matched study requires equal canonical output gain');
  const record=records[part];validateRestAdmission(record,recipe);
  const pcm=renderRestRecord(record,recipe);assert.equal(pcm.channels[0].length,mixed[0].length);
  sources.push(pcm);const stem=name+'-part-'+(part+1),json=JSON.stringify(record,null,2)+'\n',wav=Buffer.from(stereoWav(pcm));
  await fs.writeFile(path.join(out,stem+'.json'),json);await fs.writeFile(path.join(out,stem+'.wav'),wav);
  parts.push({part:part+1,baseMidi:notes[part],record:stem+'.json',recordSha256:sha(json),wav:stem+'.wav',wavSha256:sha(wav),outputGain:recipe.outputGain,pickupScale:recipe.pickupScale});
 }
 let peak=0;
 for(let ch=0;ch<2;ch++)for(let i=0;i<mixed[ch].length;i++){
  const sample=sources.reduce((sum,pcm)=>sum+pcm.channels[ch][i]*mixGain,0);
  if(!Number.isFinite(sample)||Math.abs(sample)>.900001)throw new Error('Invalid ensemble output bound');
  mixed[ch][i]=sample;peak=Math.max(peak,Math.abs(mixed[ch][i]));
 }
 const wav=Buffer.from(stereoWav({sampleRate,channels:mixed}));await fs.writeFile(path.join(out,name+'.wav'),wav);
 report.cases.push({name,notes,parts,peak,samples:mixed[0].length,wavSha256:sha(wav)});
}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(out,'index.html'),openPhrasePlayer({
 title:'Three Groves',playLinkLabel:'Play a single Grove ↗',
 intro:'The same gestures, on three separate instruments. Hear them share a pitch center, then hear their centers spread into C, E-flat and G.',
 question:'Does a harmonic outline give the bodies a stronger identity? What do you miss from the shared center?',
 disclosure:'Authored ensemble study. Each Grove keeps its close internal tuning; the three Groves are independent. Their outputs share a fixed one-third mix gain. No playback-rate shift or loudness normalization. C, E-flat and G name the nominal tuning centers. No listening verdict.',
 cases:report.cases.map(c=>({file:c.name+'.wav',wavSha256:c.wavSha256,label:c.name==='shared-center'?'One shared center':'C · E♭ · G'}))
}));
console.log(JSON.stringify(report,null,2));
