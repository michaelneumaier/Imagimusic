import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createContinuousEnsemblePerformance} from '../src/living/continuous-ensemble-study.js';
import {renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {stereoWav} from '../src/loom/model.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';
const directory=resolve(process.argv[2]??'renders/living-ensemble-resonance-study');mkdirSync(directory,{recursive:true});
const source=createContinuousEnsemblePerformance(42),original=new Float32Array(source.plan.frames);source.start();
while(source.state!=='ended')source.process(original.subarray(source.frame,Math.min(original.length,source.frame+4096)));
const sourceRecords=source.records(),cases=[];
for(const [name,label,lengths,targets] of [
 ['current','Current family · 80 / 95 / 65 mm',[80,95,65],null],
 ['octaves','Near octaves · 85 / 120 / 60 mm',[85,120,60],[1,.5,2]],
 ['open','Near an open triad · 90 / 110 / 70 mm',[90,110,70],[1,2/3,5/3]],
]){
 const candidate={kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:sourceRecords.map((record,i)=>({...record,design:createTineDesign({lengthMm:lengths[i]})}))};
 // The strict renderer walks every changed body's admitted physical history.
 // No fitted audio, resampling, per-example normalization or score edits.
 const rendered=renderContinuousEnsembleRecord(candidate),mono=rendered.channels[0];
 rendered.record.records.forEach((record,i)=>assert.deepEqual(record.events,sourceRecords[i].events));
 if(name==='current')assert.deepEqual(mono,original);
 const modes=rendered.record.records.map(record=>createTineImpulse(requestForTineDesign(record.design).geometry).modes.map(mode=>mode.omega/(2*Math.PI)));
 const ratios=modes.map(body=>body[0]/modes[0][0]);
 let peak=0;const channels=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)].map(pan=>Float32Array.from(mono,x=>{
  const sample=x*24*pan;if(!Number.isFinite(sample)||Math.abs(sample)>1)throw Error('Preview exceeds headroom; inspect the design rather than normalize it.');peak=Math.max(peak,Math.abs(sample));return sample;
 }));
 const wav=new Uint8Array(stereoWav({sampleRate:rendered.sampleRate,channels})),wavSha256=createHash('sha256').update(wav).digest('hex');
 writeFileSync(resolve(directory,name+'.wav'),wav);writeFileSync(resolve(directory,name+'.json'),JSON.stringify(rendered.record,null,2)+'\n');
 cases.push({name,label,file:name+'.wav',wavSha256,lengthsMm:lengths,modeFrequenciesHz:modes,firstModeRatios:ratios,targetRatios:targets,targetErrorsCents:targets?ratios.map((ratio,i)=>1200*Math.log2(ratio/targets[i])):null,seconds:rendered.seconds,previewPeak:peak,events:rendered.record.records.map(record=>record.events.length)});
}
const scope='All three examples use seed 42 and the same 25 notes, voice assignments, timing, accents and 48-second ending. The fixed mix is one third per voice, followed by preview gain 24. Only body lengths change; pitch, decay, compliance and relative output level change together. These are independent four-mode cantilevers with velocity pickups, without acoustic radiation or mechanical coupling. First-mode ratios do not make their higher partials harmonic or establish consonance or preference. Strict record admission and exact baseline sample identity are checked. These are offline, sound-only candidates; the live ensemble is unchanged.';
writeFileSync(resolve(directory,'report.json'),JSON.stringify({kind:'imagimusic-ensemble-resonance-comparison',version:1,sampleRate:48000,mixGain:1/3,previewGain:24,cases,scope},null,2)+'\n');
writeFileSync(resolve(directory,'index.html'),openPhrasePlayer({title:'The space between voices',intro:'One complete phrase moves through three different families of ringing bodies. The rhythm, accents and voice assignments stay the same. Choose a family and let the piece unfold.',question:'Does the phrase feel more connected in one family? Which returning voice is easiest to recognize? Notice the character of the ringing as well as the pitch relationships. There need not be a preferred version.',disclosure:scope,cases,playLinkLabel:'Return to the current live ensemble ↗',playLinkHref:'../../living-ensemble.html',listeningDb:0,listeningKey:'imagimusic-ensemble-resonance-study-db',listeningHelp:'Every example shares this extra playback level. Files already use the same fixed gain of 24 and are not normalized individually. Changing body length also changes response level; this is not an equal-loudness comparison. Strong playback peaks can meet a sample ceiling.'}));
console.log(JSON.stringify({directory,cases:cases.map(({modeFrequenciesHz,...rest})=>rest)},null,2));
