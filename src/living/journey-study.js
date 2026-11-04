import {createLivingDirectedPhrase} from './generative-phrase.js';
import {validateTineLiveRecord} from '../tine/live-record.js';
import {createLivingArrangement,renderLivingArrangement} from './arrangement.js';

// A finite authored development, not an adaptive composer. Every chapter
// derives afresh from one seed; changes never accumulate rounding or gain.
const chapters=[
 ['recognition','original',1,1,false,2],
 ['a question','open',3,.7,true,2.5],
 ['the full answer','open',2,.85,false,1.5],
 ['gathering','close',2,1,false,.75],
 ['interweaving','close',1,1,false,2],
 ['recollection','open',3,.6,false,3],
 ['home','original',1,1,false,0],
];

export function createLivingJourneyStudy(seed){
 let cursor=0;
 const sections=chapters.map(([name,spacing,arrangementVersion,strengthScale,firstCellOnly,gapSeconds])=>{
  const basis=createLivingDirectedPhrase(seed,spacing).source;
  const events=basis.events.slice(0,firstCellOnly?3:6).map(e=>({...e,strength:e.strength*strengthScale}));
  const source=validateTineLiveRecord({...basis,events,fadeStart:events.at(-1).frame+60000});
  const arrangement=createLivingArrangement(source,arrangementVersion);
  const startFrame=cursor,endFrame=startFrame+arrangement.frames;
  cursor=endFrame+Math.round(gapSeconds*basis.sampleRate);
  return Object.freeze({name,spacing,arrangementVersion,strengthScale,firstCellOnly,startFrame,endFrame,gapSeconds,source,arrangement});
 });
 return Object.freeze({kind:'imagimusic-living-journey-study',version:1,seed,sampleRate:48000,frames:cursor,sections:Object.freeze(sections)});
}

export function renderLivingJourneyStudy(seed){
 const plan=createLivingJourneyStudy(seed),channels=[new Float32Array(plan.frames),new Float32Array(plan.frames)];
 for(const section of plan.sections){
  const pcm=renderLivingArrangement(section.source,section.arrangementVersion);
  channels.forEach((channel,i)=>channel.set(pcm.channels[i],section.startFrame));
 }
 let peak=0;
 for(const channel of channels)for(const sample of channel)peak=Math.max(peak,Math.abs(sample));
 if(!Number.isFinite(peak)||peak>1)throw Error('Journey exceeds source PCM range.');
 return {plan,channels,sampleRate:plan.sampleRate,frames:plan.frames,seconds:plan.frames/plan.sampleRate,peak};
}
