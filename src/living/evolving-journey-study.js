import {createLivingDirectedPhrase} from './generative-phrase.js';
import {createLivingArrangement} from './arrangement.js';
import {validateTineLiveRecord} from '../tine/live-record.js';
import {renderLivingConnectedPlan} from './connected-journey-study.js';

// Musical choices are authored, not emotional inference. Each transformation
// derives independently from the same seed and retains both cell boundaries.
const chapters=[
 ['recognition','original',0,false,1,1],
 ['a wider answer','open',0,false,.85,2],
 ['the accent moves','original',1,false,.85,2],
 ['the rhythm turns','open',1,true,.85,2],
 ['another side','open',2,true,.9,3],
 ['gathering','original',2,false,1,2],
 ['closer','close',0,false,1,2],
 ['crossing currents','close',1,true,1,1],
 ['at the center','close',2,false,1,1],
 ['loosening','original',1,true,.8,3],
 ['the familiar rhythm','original',1,false,.75,2],
 ['the familiar accent','open',0,false,.7,2],
 ['recollection','open',0,false,.6,3],
 ['home','original',0,false,1,1],
];

export function createLivingMotifVariation(seed,{spacing='original',rotation=0,reflected=false,strengthScale=1}={}){
 if(![0,1,2].includes(rotation)||typeof reflected!=='boolean'||!Number.isFinite(strengthScale)||strengthScale<=0||strengthScale>1)throw Error('Unsupported motif variation.');
 const basis=createLivingDirectedPhrase(seed,spacing),events=[];
 for(let cell=0;cell<2;cell++){
  const source=basis.source.events.slice(cell*3,cell*3+3),start=source[0].frame,end=source[2].frame;
  const times=reflected?[start,start+end-source[1].frame,end]:source.map(e=>e.frame);
  for(let i=0;i<3;i++)events.push({frame:times[i],strength:source[(i+rotation)%3].strength*strengthScale});
 }
 const source=validateTineLiveRecord({...basis.source,events});
 return Object.freeze({source,derivation:Object.freeze({seed,spacing,rotation,reflected,strengthScale,rule:'reflect-cell-intervals-rotate-cell-accents'})});
}

export function createLivingEvolvingJourneyStudy(seed){
 const rate=48000,sections=[],voices=[];let lastTouch=0,end=0;
 chapters.forEach(([name,spacing,rotation,reflected,strengthScale,version],i)=>{
  const variation=createLivingMotifVariation(seed,{spacing,rotation,reflected,strengthScale});
  const arrangement=createLivingArrangement(variation.source,version),part=i===0?'opening':i===chapters.length-1?'return':'answer';
  const selected=arrangement.voices.filter(v=>v.part===part);
  const firstLocal=Math.min(...selected.map(v=>v.startFrame+arrangement.bodies[v.body].events[0].frame));
  const gapFrames=Math.round((i===1||part==='return'?1.8:i>=10?.8:.55)*rate);
  const firstTouch=i===0?firstLocal:lastTouch+gapFrames,offset=firstTouch-firstLocal;
  const next=selected.map(v=>Object.freeze({...v,section:i,startFrame:v.startFrame+offset,endFrame:v.endFrame+offset}));
  lastTouch=Math.max(...next.map(v=>v.startFrame+arrangement.bodies[v.body].events.at(-1).frame));
  const endFrame=Math.max(...next.map(v=>v.endFrame));end=Math.max(end,endFrame);
  sections.push(Object.freeze({name,source:variation.source,derivation:variation.derivation,arrangement,startFrame:Math.min(...next.map(v=>v.startFrame)),firstTouchFrame:firstTouch,lastTouchFrame:lastTouch,endFrame}));voices.push(...next);
 });
 return Object.freeze({kind:'imagimusic-living-evolving-journey-study',version:1,seed,sampleRate:rate,frames:end,sections:Object.freeze(sections),voices:Object.freeze(voices)});
}

export function renderLivingEvolvingJourneyStudy(seed){return renderLivingConnectedPlan(createLivingEvolvingJourneyStudy(seed));}
