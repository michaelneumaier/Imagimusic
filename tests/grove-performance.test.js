import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove,composeGroveGreeting,greetingStrikes,GROVE_SEEDS} from '../src/score/grove.js';
import {networkStrikeResponse} from '../src/coupling.js';
import {createGroveInstrument,renderGroveBank,groveTailLevel,grovePerformanceFrame} from '../src/grove/performance.js';
import {createGroveSession} from '../src/grove/session.js';
import {mixImpulseRecording} from '../src/touch/session.js';
test('Grove unit sound agrees with the physical displacement and declared stereo pickup',()=>{
 const instrument=createGroveInstrument(composeGrove({seed:3}),8000),bank=renderGroveBank(instrument);
 for(let struck=0;struck<3;struck++){
  const response=networkStrikeResponse(instrument.system,[0,1,2].map(i=>i===struck?1:0));
  for(const frame of [0,1,117,3771,16001,bank[struck].channels[0].length-1]){
   const t=frame/8000,x=response.x(t);
   for(let channel=0;channel<2;channel++){
    const expected=instrument.outputGain*groveTailLevel(instrument,t)*instrument.pickupScale*x.reduce((sum,value,i)=>sum+value*instrument.pans[i][channel],0);
    assert.ok(Math.abs(bank[struck].channels[channel][frame]-expected)<2e-8);
   }
  }
 }
});
test('curated greetings fit fixed gain/headroom, records are detached, and visual seeking is stateless',()=>{
 for(const seed of GROVE_SEEDS){
  const grove=composeGrove({seed}),session=createGroveSession(grove,8000),notes=greetingStrikes(composeGroveGreeting(grove));
  for(const note of notes)assert.equal(session.strike({frame:Math.round(note.time*8000),body:note.body,velocity:note.velocity}).accepted,true);
  const record=session.snapshot(),t=notes[4].time+.1,pose=session.visual(t);session.visual(40);assert.deepEqual(session.visual(t),pose);
  record.grove.bodies[0].mass=99;record.events[0].velocity=99;assert.notEqual(session.snapshot().grove.bodies[0].mass,99);assert.notEqual(session.snapshot().events[0].velocity,99);
  assert.ok(session.visual(40).envelope.every(x=>x===0));
 }
});
test('saved Grove mix and visible displacement retain superposed phase and the recorded ending',()=>{
 const session=createGroveSession(composeGrove({seed:7}),8000);session.strike({frame:0,body:0,velocity:.8});session.strike({frame:977,body:2,velocity:.6});
 const record=session.finish(5000),instrument=session.instrument,bank=renderGroveBank(instrument),pcm=mixImpulseRecording(record,bank);
 for(const i of [1,978,1490,4999,5000,5100]){
  const time=i/8000,frame=session.visual(time);
  for(let c=0;c<2;c++){const projected=instrument.outputGain*frame.displacement.reduce((s,value,body)=>s+value*instrument.pans[body][c],0);assert.ok(Math.abs(projected-pcm.channels[c][i])<3e-8);}
 }
 assert.deepEqual(session.visual(1).envelope,[0,0,0]);
 assert.throws(()=>{instrument.grove.bodies[0].mass=2;},TypeError);
});
