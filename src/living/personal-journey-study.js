import {validateTineLiveRecord} from '../tine/live-record.js';
import {createLivingArrangement} from './arrangement.js';
import {renderLivingConnectedPlan} from './connected-journey-study.js';

// A finite composition from the supplied phrase, not inferred style or emotion.
const chapters=[
 ['your phrase',1,0,false,1,1],
 ['heard elsewhere',1,0,false,.85,2],
 ['an accent answers',1,1,false,.85,2],
 ['the rhythm turns',1.15,1,true,.85,2],
 ['closer',.8,0,false,1,1],
 ['recollection',1,0,false,.65,2],
 ['home',1,0,false,1,1],
];

export function validateLivingPersonalSource(value){
 const source=validateTineLiveRecord(value);
 if(source.design.lengthMm!==80||source.design.widthMm!==10||!source.events.length||source.events.some(e=>e.strength<=0||e.strength>.1))throw Error('Use a completed80×10mm phrase with one to eight positive touches no stronger than0.1.');
 return source;
}

/** Retain every event, including coincident touches. Whole-phrase reflection
 * reverses the interval order; accent rotation permutes the original strengths.
 * Timing derives afresh from the input. The original post-touch tail is retained.
 */
export function createLivingPersonalVariation(value,{spacing=1,rotation=0,reflected=false,strengthScale=1}={}){
 const basis=validateLivingPersonalSource(value),n=basis.events.length,rate=basis.sampleRate;
 if(![.8,1,1.15].includes(spacing)||!Number.isInteger(rotation)||rotation<0||rotation>=n||typeof reflected!=='boolean'||!Number.isFinite(strengthScale)||strengthScale<=0||strengthScale>1)throw Error('Unsupported personal phrase variation.');
 const first=basis.events[0].frame,last=basis.events.at(-1).frame,span=last-first,tail=basis.fadeStart-last;
 const available=Math.min(4*rate-first,8*rate-Math.round(.025*rate)-tail-first);
 const newSpan=Math.min(Math.round(span*spacing),available),scale=span?newSpan/span:1;
 const events=basis.events.map((_,i)=>{
  const timeIndex=reflected?n-1-i:i,strengthIndex=(i+rotation)%n;
  const frame=reflected?first+last-basis.events[timeIndex].frame:basis.events[timeIndex].frame;
  return {frame:first+Math.round((frame-first)*scale),strength:basis.events[strengthIndex].strength*strengthScale};
 });
 const source=validateTineLiveRecord({...basis,events,fadeStart:first+newSpan+tail});
 return {source,derivation:Object.freeze({spacing,rotation,reflected,strengthScale,originalSpan:span,actualSpan:newSpan,rule:'whole-phrase-interval-reflection-and-accent-rotation'})};
}

export function createLivingPersonalJourneyStudy(value){
 const source=validateLivingPersonalSource(value),rate=source.sampleRate,sections=[],voices=[];let lastTouch=0,end=0;
 chapters.forEach(([name,spacing,rotation,reflected,strengthScale,version],index)=>{
  const variation=createLivingPersonalVariation(source,{spacing,rotation:rotation%source.events.length,reflected,strengthScale});
  const arrangement=createLivingArrangement(variation.source,version),part=index===0?'opening':index===chapters.length-1?'return':'answer';
  const selected=arrangement.voices.filter(v=>v.part===part);
  const firstLocal=Math.min(...selected.map(v=>v.startFrame+arrangement.bodies[v.body].events[0].frame));
  const gap=Math.round((index===1||part==='return'?1.8:.55)*rate);
  const firstTouch=index===0?firstLocal:Math.max(lastTouch+gap,part==='return'||index===1?end+source.events[0].frame:0);
  const offset=firstTouch-firstLocal;
  const next=selected.map(v=>Object.freeze({...v,section:index,startFrame:v.startFrame+offset,endFrame:v.endFrame+offset}));
  lastTouch=Math.max(...next.map(v=>v.startFrame+arrangement.bodies[v.body].events.at(-1).frame));
  const endFrame=Math.max(...next.map(v=>v.endFrame));end=Math.max(end,endFrame);
  sections.push(Object.freeze({name,source:variation.source,derivation:variation.derivation,arrangement,startFrame:Math.min(...next.map(v=>v.startFrame)),firstTouchFrame:firstTouch,lastTouchFrame:lastTouch,endFrame}));voices.push(...next);
 });
 return Object.freeze({kind:'imagimusic-living-personal-journey-study',version:1,source,sampleRate:rate,frames:end,sections:Object.freeze(sections),voices:Object.freeze(voices)});
}

export function renderLivingPersonalJourneyStudy(value){return renderLivingConnectedPlan(createLivingPersonalJourneyStudy(value));}
