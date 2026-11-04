import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createEnsembleJourneyStudy} from '../src/living/ensemble-journey-study.js';
import {renderContinuousEnsembleRecord} from '../src/living/continuous-ensemble-record.js';
const directory=resolve(process.argv[2]??'renders/living-ensemble-journey-pacing');mkdirSync(directory,{recursive:true});
const sampleRate=48000,windowFrames=4800,cases=[];
function intervals(values,predicate){const spans=[];let start=null;values.forEach((v,i)=>{if(predicate(v)){if(start===null)start=i;}else if(start!==null){spans.push({startSeconds:start/10,endSeconds:i/10,seconds:(i-start)/10});start=null;}});if(start!==null)spans.push({startSeconds:start/10,endSeconds:values.length/10,seconds:(values.length-start)/10});return spans;}
for(const [name,seed,gesture] of [
 ['offered-middle',42,null],['offered-opening',3911836942,null],['offered-final',3382146154,null],
 ['personal-close',42,[{frame:0,strength:.025},{frame:5760,strength:.1},{frame:14400,strength:.05}]],
 ['personal-wide',42,[{frame:0,strength:.025},{frame:72000,strength:.1},{frame:144000,strength:.05}]],
]){
 const plan=createEnsembleJourneyStudy(seed,{sampleRate,gesture}),rms=[],chapters=[],digest=createHash('sha256');let offset=0;
 for(const chapter of plan.chapters){
  const rendered=renderContinuousEnsembleRecord(chapter.record),samples=rendered.channels[0];digest.update(new Uint8Array(samples.buffer));
  for(let start=0;start<samples.length;start+=windowFrames){let energy=0;for(let i=start;i<Math.min(start+windowFrames,samples.length);i++){if(!Number.isFinite(samples[i]))throw Error('Nonfinite rendered sample.');energy+=samples[i]*samples[i];}rms.push(Math.sqrt(energy/Math.min(windowFrames,samples.length-start)));}
  chapters.push({name:chapter.name,startSeconds:offset,firstTouchSeconds:offset+chapter.events[0].frame/sampleRate,lastTouchSeconds:offset+chapter.events.at(-1).frame/sampleRate});offset+=rendered.seconds;
 }
 const peakRms=Math.max(...rms),levels=rms.map(x=>x?20*Math.log10(x/peakRms):null),thresholds=[-20,-40,-60].map(db=>{const spans=intervals(rms,v=>v<peakRms*10**(db/20)),totalSeconds=spans.reduce((n,s)=>n+s.seconds,0);return {dbBelowPeakRms:db,totalSeconds,fraction:totalSeconds/offset,longest:spans.reduce((a,b)=>!a||b.seconds>a.seconds?b:a,null),spans};});
 cases.push({name,seed,gesture,seconds:offset,rawSha256:digest.digest('hex'),windowSeconds:.1,peakRms,peakPreviewChannelRms:peakRms*24/Math.sqrt(2),chapters,thresholds,relativeRmsDb:levels});
}
const scope='Non-overlapping 100ms RMS windows of the exact raw three-body mix. Thresholds are relative to each case’s own maximum RMS window, not hearing thresholds or loudness matching. Null levels mean exact zero. Bins quantize gap boundaries to100ms. Fixed chapter boundaries at48/96s reset physical state after the recorded fade. This measures temporal energy distribution; it cannot establish audibility, boredom, spiritual effects or musical preference. No existing score or WAV changes.';
writeFileSync(resolve(directory,'report.json'),JSON.stringify({kind:'imagimusic-ensemble-journey-pacing',version:1,sampleRate,cases,scope},null,2)+'\n');
console.log(JSON.stringify({directory,cases:cases.map(({relativeRmsDb,thresholds,...rest})=>({...rest,thresholds:thresholds.map(({spans,...summary})=>summary)})),scope},null,2));
