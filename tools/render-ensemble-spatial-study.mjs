import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {createEnsembleJourneyStudy} from '../src/living/ensemble-journey-study.js';
import {renderContinuousTineRecord} from '../src/living/continuous-tine-record.js';
import {stereoWav} from '../src/loom/model.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';
import {ensembleComparisonPicture} from './ensemble-comparison-picture.mjs';
const directory=resolve(process.argv[2]??'renders/living-ensemble-spatial-study');mkdirSync(directory,{recursive:true});
const plan=createEnsembleJourneyStudy(),rate=plan.sampleRate,voices=[0,1,2].map(()=>new Float32Array(144*rate)),records=[];
plan.chapters.forEach((chapter,c)=>{const parts=chapter.record.records.map(renderContinuousTineRecord);parts.forEach((part,i)=>voices[i].set(part.channels[0],c*48*rate));records.push({...chapter.record,records:parts.map(part=>part.record)});});
const pans=[.5,.2,.8],gains=pans.map(pan=>pan===.5?[1,1]:[Math.cos(pan*Math.PI/2)*Math.sqrt(2),Math.sin(pan*Math.PI/2)*Math.sqrt(2)]);
// Relative to the existing centered coefficient1/sqrt(2), each isolated voice
// retains unit total left/right squared gain. Summed mixtures are not loudness matched.
for(const gain of gains)assert.ok(Math.abs((gain[0]**2+gain[1]**2)/2-1)<1e-14);
const cases=[];
for(const name of ['centered','spread']){
 const channels=[new Float32Array(voices[0].length),new Float32Array(voices[0].length)];let peak=0,centerOnlyFrames=0;
 for(let i=0;i<voices[0].length;i++){
  const centered=Math.fround((voices[0][i]+voices[1][i]+voices[2][i])*(1/3)),solo=voices[1][i]===0&&voices[2][i]===0;if(solo)centerOnlyFrames++;
  for(let channel=0;channel<2;channel++){
   const mix=name==='centered'?centered:Math.fround((voices[0][i]*gains[0][channel]+voices[1][i]*gains[1][channel]+voices[2][i]*gains[2][channel])*(1/3));
   const sample=Math.fround(mix*24/Math.sqrt(2));assert.ok(Number.isFinite(sample)&&Math.abs(sample)<1);channels[channel][i]=sample;peak=Math.max(peak,Math.abs(sample));
   if(solo)assert.equal(sample,Math.fround(centered*24/Math.sqrt(2)));
  }
 }
 const wav=new Uint8Array(stereoWav({sampleRate:rate,channels})),wavSha256=createHash('sha256').update(wav).digest('hex');if(name==='centered')assert.equal(wavSha256,'58df437ce18da2d237e12155563e3f2e01afb9b67803ffa4ded085cac9ba054c');
 writeFileSync(resolve(directory,name+'.wav'),wav);cases.push({name,label:name==='centered'?'Together in the center · 2:24':'A little room between voices · 2:24',file:name+'.wav',wavSha256,previewPeak:peak,centerOnlyFrames});
}
const scope='Same52 touches, physical body histories, timing and original chapter endings. Only fixed stereo gains differ. The foreground80mm voice stays centered; the95mm voice is placed left and65mm voice right, matching their initial scene positions. Static equal-power panning, not acoustic propagation, room simulation, binaural localization or camera-tracked audio. Each isolated voice retains the same summed squared channel gain, but simultaneous signals can interfere differently; this is not a loudness-matched comparison. Both use fixed preview gain24 and mix1/3, without individual normalization. The physical response picture is identical in both. Existing journey/recipes remain unchanged.';
writeFileSync(resolve(directory,'report.json'),JSON.stringify({kind:'imagimusic-ensemble-spatial-comparison',version:1,sampleRate:rate,seconds:144,pans,relativeChannelGains:gains,cases,records,scope},null,2)+'\n');
let html=openPhrasePlayer({title:'Room between voices',intro:'One idea passes among three instruments. Hear the same journey gathered in the center, then with a little space between its voices. Nothing about the notes or the bodies changes.',question:'Is it easier to follow which voice is answering? Does the space help the ensemble feel connected, or pull it apart? Headphones and speakers may give different impressions; either version may be preferable.',disclosure:scope,cases,playLinkHref:'../living-ensemble-journey-study/index.html',playLinkLabel:'Return to A way home ↗',listeningDb:0,listeningKey:'imagimusic-ensemble-spatial-db',listeningHelp:'One shared level for both examples. Stereo placement can change combined level and interference; the files are not normalized separately.'});
html=ensembleComparisonPicture(html,{records,entries:cases.map(c=>({file:c.file,treatment:'original',description:c.name==='centered'?'Centered: all three modeled pickups share the center of the stereo image.':'Spread: the foreground voice stays centered, with the two rear voices gently left and right. The physical response is unchanged; placement does not follow camera movement.'}))});
writeFileSync(resolve(directory,'index.html'),html);console.log(JSON.stringify({directory,pans,gains,cases},null,2));
