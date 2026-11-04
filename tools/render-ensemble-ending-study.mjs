import {createContinuousTineRelease} from '../src/living/continuous-tine-release.js';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createEnsembleJourneyStudy} from '../src/living/ensemble-journey-study.js';
import {renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
import {stereoWav} from '../src/loom/model.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';
const directory=resolve(process.argv[2]??'renders/living-ensemble-ending-study');mkdirSync(directory,{recursive:true});
const plan=createEnsembleJourneyStudy(),rate=plan.sampleRate,raw=new Float32Array(144*rate),records=[];
plan.chapters.forEach((chapter,index)=>{const rendered=renderContinuousEnsembleRecord(chapter.record);raw.set(rendered.channels[0],index*48*rate);records.push(rendered.record);});
function rms(start,end){let energy=0;for(let i=start;i<end;i++)energy+=raw[i]*raw[i];return Math.sqrt(energy/(end-start));}
let peakRms=0;for(let start=0;start<raw.length;start+=4800)peakRms=Math.max(peakRms,rms(start,start+4800));
const boundaries=[48,96,144].map(seconds=>({seconds,preEndingWindow:[seconds-.2,seconds-.1],rmsDbBelowPiecePeak:20*Math.log10(rms(Math.round((seconds-.2)*rate),Math.round((seconds-.1)*rate))/peakRms)}));
const modeled=new Float32Array(raw.length),releaseEvidence=[];
records.forEach((record,chapter)=>{
 const startFrame=(chapter===2?42:45)*rate;
 const releases=record.records.map(source=>createContinuousTineRelease(source,{startFrame,addedDecayRate:1})),parts=releases.map(release=>release.render());
 for(let i=0;i<48*rate;i++)modeled[chapter*48*rate+i]=(parts[0].channels[0][i]+parts[1].channels[0][i]+parts[2].channels[0][i])*record.mixGain;
 releaseEvidence.push(releases.map(release=>({startFrame,addedDecayRate:1,initialEnergyJ:release.at(startFrame/rate).energyJ,terminalEnergyJ:release.at(48).energyJ})));
});
const cases=[];
for(const [name,label,soft] of [['original','Original endings · 2:24',false],['gentler','Gentler closing fades · 2:24',true],['modeled','The bodies settle · modeled loss · 2:24',false]]){
 const mono=new Float32Array(raw.length);let changedSamples=0;
 for(let i=0;i<raw.length;i++){
  const chapter=Math.min(2,Math.floor(i/(48*rate))),end=(chapter+1)*48*rate-1,fadeFrames=(chapter===2?6:3)*rate,start=end-fadeFrames+1;
  const gain=soft&&i>=start?.5*(1+Math.cos(Math.PI*(i-start)/(fadeFrames-1))):1;
  mono[i]=name==='modeled'?modeled[i]:raw[i]*gain;
  if(name==='original'||i<start)assert.equal(mono[i],raw[i]);else if(soft)assert.ok(Math.abs(mono[i])<=Math.abs(raw[i]));
  if(mono[i]!==raw[i])changedSamples++;
 }
 let peak=0;const channels=[0,1].map(()=>Float32Array.from(mono,x=>{const y=x*24/Math.sqrt(2);assert.ok(Number.isFinite(y)&&Math.abs(y)<1);peak=Math.max(peak,Math.abs(y));return y;}));
 const wav=new Uint8Array(stereoWav({sampleRate:rate,channels})),wavSha256=createHash('sha256').update(wav).digest('hex');
 if(name==='original')assert.equal(wavSha256,'58df437ce18da2d237e12155563e3f2e01afb9b67803ffa4ded085cac9ba054c');
 writeFileSync(resolve(directory,name+'.wav'),wav);cases.push({name,label,file:name+'.wav',wavSha256,changedSamples,previewPeak:peak});
}
const scope='All three examples use exactly the same three admitted chapter histories, 52 touches, instrument family, 144-second duration and preview gain24. The gentler-fade candidate adds a raised-cosine OUTPUT fade over the last3 seconds of the first two chapters and last6 seconds of the final chapter. The original25ms captured endings remain underneath. That is artistic playback gain, not physical damping. The modeled-loss candidate instead engages ideal distributed viscous damping at the same times, adding1 per second to each modal decay rate. Displacement/velocity remain continuous and both sound and response state follow the altered dynamics. This is not a simulated felt contact, collision or acoustic radiation. All samples before those windows are identical before WAV encoding; no individual normalization. The existing journey and saved recipes are unchanged. Measured100ms RMS levels are not hearing thresholds, loudness matching or evidence of preference. This sound-only comparison does not show the candidate in the instrument view.';
writeFileSync(resolve(directory,'report.json'),JSON.stringify({kind:'imagimusic-ensemble-ending-comparison',version:1,sampleRate:rate,seconds:144,cases,boundaries,candidateFadeWindowsSeconds:[[45,48],[93,96],[138,144]],releaseEvidence,records,scope},null,2)+'\n');
writeFileSync(resolve(directory,'index.html'),openPhrasePlayer({title:'Room to finish',intro:'The same journey, with three ways of leaving each chapter. The notes and their timing stay intact. Compare how the sound leaves the space, especially at the final ending.',question:'Which departure feels complete: the original cutoff, a volume fade, or a body whose vibration settles? Does any treatment take away the instrument’s presence? You can seek near45,93 or138 seconds to compare the closing passages. The original may be the version you prefer.',disclosure:scope,cases,playLinkHref:'../living-ensemble-journey-study/index.html',playLinkLabel:'Return to A way home ↗',listeningDb:0,listeningKey:'imagimusic-ensemble-ending-db',listeningHelp:'All files use the same fixed gain24. This adds one shared playback level; they are not normalized separately.'}));
console.log(JSON.stringify({directory,boundaries,cases},null,2));
