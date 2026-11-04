import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingGeneratedPhrase} from '../src/living/generative-phrase.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {createLivingRecord,livingFragment,readLivingAddress} from '../src/living/record.js';

test('seeded grammar repeats a recognizable cell with an explicit bounded variation and decay space',()=>{
 const signatures=new Set(),variations=new Set();
 for(let seed=0;seed<256;seed++){
  const p=createLivingGeneratedPhrase(seed),e=p.source.events;
  assert.deepEqual(createLivingGeneratedPhrase(seed),p);assert.equal(e.length,6);
  assert.ok(e.every((x,i)=>x.frame<=4*48000&&(!i||x.frame>e[i-1].frame)));
  assert.equal(e[4].frame-e[3].frame,e[1].frame-e[0].frame);
  assert.equal(e[5].frame-e[3].frame,e[2].frame-e[0].frame+(p.variation==='linger'?p.pulseFrames:0));
  for(let i=0;i<3;i++)assert.equal(e[i+3].strength,e[i].strength*(p.variation==='soften'?.5:1));
  assert.ok(e[3].frame-e[2].frame>=2*p.pulseFrames);
  assert.equal(p.source.fadeStart-e[5].frame,60000);
  assert.ok(Object.isFrozen(p)&&Object.isFrozen(p.motif)&&Object.isFrozen(p.source.events));
  signatures.add(JSON.stringify(p.source));variations.add(p.variation);
 }
 assert.ok(signatures.size>30);assert.equal(variations.size,3);
});

test('boundary seeds produce complete finite arrangements and exact saved sources',()=>{
 for(const seed of [0,42,2026,0xffffffff]){
  const p=createLivingGeneratedPhrase(seed),pcm=renderLivingArrangement(p.source);
  assert.ok(pcm.seconds>10&&pcm.seconds<25);assert.ok(pcm.peak>0&&pcm.peak<=1);
  assert.deepEqual(pcm.plan.bodies[0],p.source);
  assert.equal(pcm.plan.voices.at(-1).body,0);
  assert.deepEqual(readLivingAddress(livingFragment(createLivingRecord(p.source))).source,p.source);
  assert.ok(pcm.channels.every(ch=>ch.every(Number.isFinite)));
 }
 for(const seed of [-1,2**32,.5,NaN,Infinity,'42',null])assert.throws(()=>createLivingGeneratedPhrase(seed));
});

test('grammar version1 pins the source for seed42',()=>{
 const p=createLivingGeneratedPhrase(42);
 assert.equal(p.version,1);assert.equal(p.pulseFrames,12000);assert.equal(p.repeatOffsetTicks,5);assert.equal(p.variation,'linger');
 assert.deepEqual(p.source.events,[{frame:16800,strength:.05},{frame:28800,strength:.025},{frame:52800,strength:.1},{frame:76800,strength:.05},{frame:88800,strength:.025},{frame:124800,strength:.1}]);
 assert.equal(p.source.fadeStart,184800);
});

test('creative spacing preserves the same idea and source level without cumulative transforms',async()=>{
 const {createLivingDirectedPhrase}=await import('../src/living/generative-phrase.js');
 for(const seed of [0,42,2026,188545454,2950288811,0xffffffff]){
  const basis=createLivingGeneratedPhrase(seed),directions=['close','original','open'].map(d=>createLivingDirectedPhrase(seed,d));
  assert.deepEqual(directions[1].source,basis.source);
  assert.ok(directions[0].pulseFrames<directions[1].pulseFrames&&directions[1].pulseFrames<directions[2].pulseFrames);
  for(const p of directions){
   assert.deepEqual(p.source.events.map(e=>e.strength),basis.source.events.map(e=>e.strength));
   assert.deepEqual(p.source.design,basis.source.design);assert.equal(p.variation,basis.variation);
   assert.equal(p.source.events[0].frame,16800);assert.ok(p.source.events.at(-1).frame<=192000);
   assert.equal(p.source.fadeStart-p.source.events.at(-1).frame,60000);
   assert.deepEqual(p.source.events.map(e=>(e.frame-16800)/p.pulseFrames),basis.source.events.map(e=>(e.frame-16800)/basis.pulseFrames));
   assert.deepEqual(createLivingDirectedPhrase(seed,p.spacing),p);
   const pcm=renderLivingArrangement(p.source);assert.ok(Number.isFinite(pcm.peak)&&pcm.peak<=1);
  }
 }
 const bounded=createLivingDirectedPhrase(2950288811,'open');assert.equal(bounded.source.events.at(-1).frame,192000);assert.equal(bounded.pulseFrames,17520);
 for(const value of [null,{},'__proto__','slow'])assert.throws(()=>createLivingDirectedPhrase(42,value));
});
