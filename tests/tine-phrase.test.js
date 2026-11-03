import test from 'node:test';
import assert from 'node:assert/strict';
import {createTinePhrase,renderTinePhrase,TINE_PHRASE} from '../src/tine/phrase.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {renderTineImpulse} from '../src/tine/render.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const {geometry}=requestForTineDesign(createTineDesign());
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-13,`${a} differs from ${b}`);
test('phrase overlaps the original mechanical states; energy includes interference, not independent strike energies',()=>{
 const events=[{time:.1,strength:.25},{time:.3,strength:-.15}],phrase=createTinePhrase(geometry,{events}),model=createTineImpulse(geometry);
 const strikes=events.map(e=>model.strike({impulseNs:1e-6*e.strength}));
 for(const t of [0,.099,.1,.299,.3,.301,1,6]){
  const actual=phrase.modalState(t),individual=strikes.map((s,i)=>s.modalState(t-events[i].time));
  for(let i=0;i<4;i++){
   const q=individual.reduce((sum,s)=>sum+s[i].displacementM,0),v=individual.reduce((sum,s)=>sum+s[i].velocityMPerS,0),m=model.modes[i];
   near(actual[i].displacementM,q);near(actual[i].velocityMPerS,v);near(actual[i].energyJ,.5*m.massKg*v*v+.5*m.stiffnessNPerM*q*q);
  }
 }
 const cancelled=createTinePhrase(geometry,{events:[{time:0,strength:.25},{time:0,strength:-.25}]});
 assert.ok(cancelled.outputBound>0);
 for(const t of [0,.1,2,6])assert.ok(cancelled.modalState(t).every(s=>s.energyJ===0&&s.displacementM===0&&s.velocityMPerS===0));
 events[0].strength=1;assert.equal(phrase.events[0].strength,.25);assert.ok(Object.isFrozen(phrase.events[0]));
});
test('one-strike rendering matches the existing audition exactly; repeated tails share one ending and fixed gain',()=>{
 const options={events:[{time:0,strength:1}],seconds:.2};
 assert.deepEqual(renderTinePhrase(geometry,options).channels,renderTineImpulse(geometry,{seconds:.2}).channels);
 const pcm=renderTinePhrase(geometry),phrase=createTinePhrase(geometry);
 for(const i of [0,1,38400,100800,191999,250000,pcm.frames-2])assert.equal(pcm.channels[0][i],Math.fround(100*phrase.pointState(i/48000).velocityMPerS*Math.min(1,(pcm.frames-1-i)/1200)));
 assert.ok(pcm.channels[0].at(-1)===0);assert.notEqual(pcm.channels[0][250000],0);
 const wide=renderTinePhrase({...geometry,widthM:.02});
 for(let i=0;i<pcm.frames;i++)assert.equal(wide.channels[0][i],pcm.channels[0][i]/2);
 assert.deepEqual(pcm.events,TINE_PHRASE);
});
test('phrase refuses invalid timing, aggregate excess and aliased modes without changing the requested events',()=>{
 for(const events of [[],Array(9).fill({time:0,strength:.1}),[{time:NaN,strength:.1}],[{time:0,strength:Infinity}],[{time:2,strength:.1},{time:1,strength:.1}]])assert.throws(()=>createTinePhrase(geometry,{events}));
 assert.throws(()=>createTinePhrase({...geometry,lengthM:.06,widthM:.005},{activation:1,pickup:1,events:[{time:0,strength:1},{time:1,strength:1}]}),/headroom/);
 const single=createTineImpulse(geometry).strike({impulseNs:1e-6}),largeImpulse=1e-6*(.06*geometry.thicknessM)/single.displacementBoundM;
 assert.throws(()=>createTinePhrase(geometry,{impulseNs:largeImpulse,events:[{time:0,strength:1},{time:1,strength:1}]}),/Combined phrase exceeds the small-displacement/);
 assert.throws(()=>renderTinePhrase(geometry,{seconds:2.11}),/ending fade/);
 assert.throws(()=>renderTinePhrase(geometry,{sampleRate:8000}),/retained mode/);
 const worst=createTinePhrase({...geometry,lengthM:.06,widthM:.005},{activation:1,pickup:1});assert.ok(worst.outputBound<.442);
 assert.throws(()=>worst.pointState(-1));assert.throws(()=>worst.pointState(NaN));
});
