import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createContinuousTineKernel} from '../src/living/continuous-tine-kernel.js';
import {stereoWav} from '../src/loom/model.js';
const directory=resolve(process.argv[2]??'renders/living-continuous-tine-study');
const design=createTineDesign(),{geometry,options}=requestForTineDesign(design),rate=48000,frames=60*rate;
const kernel=createContinuousTineKernel(geometry,{...options,sampleRate:rate}),mono=new Float32Array(frames),events=[];
let cursor=0,maxOutputBound=0,maxDisplacementBoundM=0;
function advance(to){while(cursor<to){const count=Math.min(4096,to-cursor);kernel.process(mono.subarray(cursor,cursor+count));cursor+=count;}}
for(let cell=0;cell<20;cell++)for(const [offset,strength] of [[.35,.025],[.59,.1],[1.05,.05]]){
 const frame=Math.round((cell*3+offset)*rate);advance(frame);events.push(kernel.strike(strength));const state=kernel.snapshot();maxOutputBound=Math.max(maxOutputBound,state.outputBound);maxDisplacementBoundM=Math.max(maxDisplacementBoundM,state.displacementBoundM);
}
advance(frames);const fadeFrames=Math.round(.025*rate),fadeStart=frames-fadeFrames;
const channels=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)].map(pan=>{
 const channel=Float32Array.from(mono,v=>0+v*pan);
 for(let i=0;i<frames;i++){channel[i]*=8;if(i>=fadeStart)channel[i]*=(frames-1-i)/(fadeFrames-1);if(!Number.isFinite(channel[i])||Math.abs(channel[i])>1)throw Error('Study exceeds fixed preview headroom; no normalization applied.');}
 return channel;
});
const wav=stereoWav({sampleRate:rate,channels});let peak=0;for(const channel of channels)for(const value of channel)peak=Math.max(peak,Math.abs(value));
const report={kind:'imagimusic-continuous-tine-research',version:1,design,sampleRate:rate,frames,seconds:60,events,previewGain:8,peak,maxOutputBound,maxDisplacementBoundM,ending:{fadeStart,fadeFrames,scope:'Authored output-only ending, not physical damping or a kernel reset.'},finalState:kernel.snapshot(),sha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex'),scope:'Authored three-touch cell repeated20times on one continuously ringing four-mode body. No browser/worklet, interaction, musical preference, stress, fabrication, radiation or coupling validation. Constant-memory kernel; this offline report separately records its input. Conservative slowest-mode allowance uses a1percent admission margin; existing saved-pass formats are unchanged.'};
mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,'continuous.wav'),new Uint8Array(wav));writeFileSync(resolve(directory,'continuous.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({directory,seconds:60,touches:events.length,peak,maxOutputBound,maxDisplacementBoundM,sha256:report.sha256},null,2));
