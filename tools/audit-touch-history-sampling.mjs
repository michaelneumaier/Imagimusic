// Research only. Error against sampled reference, never a continuous-time bound.
// Run: node tools/audit-touch-history-sampling.mjs
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createTouchSession} from '../src/touch/session.js';
import {getLoomJourney} from '../src/listen/journeys.js';
const sampleRate=8000,seconds=4;
function fixture(name,journey,events,ending=null){
 const session=createTouchSession((typeof journey==='string'?getLoomJourney(journey).settings:journey),sampleRate);
 for(const [time,body,velocity] of events)assert.equal(session.strike({frame:Math.round(time*sampleRate),body,velocity}).accepted,true,`${name}: admitted fixture`);
 if(ending!==null)session.finish(Math.round(ending*sampleRate),200);
 return {name,session,record:session.snapshot()};
}
const fixtures=[
 fixture('single left','close-kin',[[0,0,.6]]),
 fixture('delayed neighbour','distant-cousins',[[0,0,.6],[.713,1,.5]]),
 fixture('simultaneous sides','tight-weave',[[.317,0,.4],[.317,1,.4]]),
 fixture('dense admitted gestures','close-kin',Array.from({length:128},(_,i)=>[i*.01,i%2,.01])),
 fixture('fast-beat averaged view',{frequency:600,coupling:.04,detune:120,loss:.45},[[0,0,.6],[.713,1,.5]]),
 fixture('natural tail cutoff',{frequency:196,coupling:.004,detune:0,loss:2},[[0,0,.6]]),
 fixture('Quiet during scheduled lead','distant-cousins',[[0,0,.6],[.713,1,.5]],.7),
];
function grid(fixture,hz,includeEdges){
 const times=Array.from({length:Math.round(seconds*hz)+1},(_,i)=>i/hz);
 if(includeEdges){for(const e of fixture.record.events)times.push(e.frame/sampleRate);
  const end=fixture.record.ended;if(end)times.push(end.frame/sampleRate,(end.frame+end.fadeFrames)/sampleRate);}
 const unique=[...new Set(times)].filter(t=>t>=0&&t<=seconds).sort((a,b)=>a-b);
 const points=unique.map(time=>({time,envelope:fixture.session.visual(time).envelope,side:'at'}));
 if(includeEdges==='split')for(const time of new Set(fixture.record.events.map(e=>e.frame/sampleRate))){if(time>0&&time<seconds)points.push({time,envelope:fixture.session.visual(time-1e-9).envelope,side:'before'});}
 return points.sort((a,b)=>a.time-b.time||(a.side==='before'?-1:b.side==='before'?1:0));
}
function errors(samples,reference){
 let cursor=0;const maximum=[0,0],squared=[0,0],referencePeak=[0,0];
 for(const point of reference){
  while(cursor+1<samples.length-1&&samples[cursor+1].time<=point.time)cursor++;
  const a=samples[cursor],b=samples[cursor+1],u=(point.time-a.time)/(b.time-a.time);
  for(let body=0;body<2;body++){
   const error=Math.abs(a.envelope[body]+u*(b.envelope[body]-a.envelope[body])-point.envelope[body]);
   maximum[body]=Math.max(maximum[body],error);squared[body]+=error*error;referencePeak[body]=Math.max(referencePeak[body],point.envelope[body]);
  }
 }
 return {maximumAbsolute:maximum,rms:squared.map(sum=>Math.sqrt(sum/reference.length)),referenceSampledPeak:referencePeak};
}
const results=fixtures.map(f=>{
 const reference1=grid(f,1000,true),reference2=grid(f,2000,true);
 const candidates=[];
 for(const hz of [30,60,120])for(const includeEventEdges of [false,true,'split']){
  const samples=grid(f,hz,includeEventEdges),a=errors(samples,reference1),b=errors(samples,reference2);
  candidates.push({hz,includeEventEdges,samples:samples.length,...b,
   maxErrorChangeWithDenserReference:b.maximumAbsolute.map((v,i)=>v-a.maximumAbsolute[i])});
 }
 return {name:f.name,record:f.record,averaged:f.session.visual(1).averaged,candidates};
});
console.log(JSON.stringify({seconds,sampleRate,scope:'First four seconds of seven fixtures. Linear interpolation of model visual envelopes; not audio waveforms. Split candidates probe 1 ns before each distinct strike and retain its at-strike sample as separate sides of one time boundary. Dense references are sampled, not exact continuous maxima. Model tail truncation and fast-beat averaging remain as implemented.',
 sourceHashes:Object.fromEntries(['src/touch/session.js','src/loom/performance.js','src/loom/model.js'].map(path=>[path,createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex')])),results},null,2));
