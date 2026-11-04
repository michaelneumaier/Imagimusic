import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingGreeting} from '../src/living/greeting.js';
import {createLivingSpacedAnswer,renderLivingAnswerStudy} from '../src/living/answer-study.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';

test('spaced entrances leave at least350ms between gesture groups across rates and densities',()=>{
 for(const rate of [44100,48000,96000])for(const times of [[.5],[.5,.525,.55,.575,.6,.625,.65,.675],[.3,1.8,3.3]]){
  const source={...createLivingGreeting(),sampleRate:rate,events:times.map(t=>({frame:Math.round(t*rate),strength:.025})),fadeStart:Math.round(4*rate)};
  const before=structuredClone(source),p=createLivingSpacedAnswer(source);
  assert.deepEqual(source,before);assert.deepEqual(p.source,before);
  for(const b of p.bodies)assert.deepEqual(b.events,source.events);
  const answers=p.voices.slice(1,4);
  for(let i=1;i<answers.length;i++)assert.ok(answers[i].startFrame+source.events[0].frame-(answers[i-1].startFrame+source.events.at(-1).frame)>=Math.round(.35*rate));
  assert.equal(p.voices[3].endFrame+Math.round(.8*rate),p.returnStart);
 }
});
test('spaced mix matches independent stems and preserves exact v1 opening and return',()=>{
 const source=createLivingGreeting(),reference=renderLivingArrangement(source),pcm=renderLivingAnswerStudy(source),p=pcm.plan;
 const expected=[new Float64Array(p.frames),new Float64Array(p.frames)];
 for(const v of p.voices){const stem=renderTineLiveRecord(p.bodies[v.body]).channels[0];for(let i=0;i<stem.length;i++){
  expected[0][v.startFrame+i]+=stem[i]*Math.cos((v.pan+1)*Math.PI/4)*v.gain;
  expected[1][v.startFrame+i]+=stem[i]*Math.sin((v.pan+1)*Math.PI/4)*v.gain;
 }}
 assert.deepEqual(pcm.channels,expected.map(c=>Float32Array.from(c)));
 for(let ch=0;ch<2;ch++){
  assert.deepEqual(pcm.channels[ch].subarray(0,p.phraseFrames),reference.channels[ch].subarray(0,p.phraseFrames));
  assert.deepEqual(pcm.channels[ch].subarray(p.returnStart),reference.channels[ch].subarray(reference.plan.returnStart));
 }
 assert.deepEqual(renderLivingAnswerStudy(source,'round'),reference);
 assert.throws(()=>renderLivingAnswerStudy(source,'other'),/Unknown/);
});

test('low-rate source remains subject to the physical mode admission guard',()=>{
 const s={...createLivingGreeting(),sampleRate:8000,events:[{frame:4000,strength:.1}],fadeStart:31800};
 assert.throws(()=>createLivingSpacedAnswer(s),/sample-rate guard/);
});

test('spaced score drives independent visual clocks and returns the original response',async()=>{
 const {createLivingArrangementView}=await import('../src/living/arrangement-view.js');
 const p=createLivingSpacedAnswer(createLivingGreeting()),view=createLivingArrangementView(p),r=p.sampleRate;
 for(const v of p.voices.slice(1,4)){
  const first=v.startFrame+p.source.events[0].frame;
  assert.equal(view.at((first-1)/r).bodies[v.body].touched,false);
  assert.equal(view.at((first+.5)/r).bodies[v.body].touched,true);
 }
 assert.deepEqual(view.at(1).bodies,view.at(p.returnStart/r+1).bodies);
 assert.equal(view.at(p.voices[3].endFrame/r).cameraOpen,1);
 assert.equal(view.at(p.returnStart/r).cameraOpen,0);
 assert.equal(view.at(p.frames/r).touches,15);
});

test('fragment answer retains complete onset groups and explicit source lineage without mutation',async()=>{
 const {createLivingFragmentAnswer}=await import('../src/living/answer-study.js');
 for(const times of [[.5],[.5,.5,.7,.9],[.3,1.8,3.3],[.5,.525,.55,.575,.6,.625,.65,.675]]){
  const s={...createLivingGreeting(),events:times.map((t,i)=>({frame:Math.round(t*48000),strength:i%2?-.025:.05}))},before=structuredClone(s);
  const full=createLivingSpacedAnswer(s),p=createLivingFragmentAnswer(s),groups=[...new Set(times)],cut=groups[Math.ceil(groups.length/2)-1];
  assert.deepEqual(s,before);assert.deepEqual(p.source,full.source);assert.deepEqual(p.voices,full.voices);assert.equal(p.frames,full.frames);
  assert.deepEqual(p.bodies[1].events,s.events.filter(e=>e.frame<=Math.round(cut*48000)));
  assert.deepEqual(p.bodies[0],full.bodies[0]);assert.deepEqual(p.bodies[2],full.bodies[2]);
  assert.deepEqual([...p.derivation.retainedSourceIndices,...p.derivation.omittedSourceIndices],s.events.map((_,i)=>i));
  for(const index of p.derivation.retainedSourceIndices)assert.deepEqual(p.bodies[1].events[index],s.events[index]);
 }
});

test('fragment PCM changes only the first answer and leaves exact opening, completion and return',()=>{
 const source=createLivingGreeting(),full=renderLivingAnswerStudy(source,'spaced'),partial=renderLivingAnswerStudy(source,'fragment'),p=partial.plan;
 const first=p.voices[1],omitted=p.source.events[p.derivation.omittedSourceIndices[0]].frame;
 for(let ch=0;ch<2;ch++){
  assert.deepEqual(partial.channels[ch].subarray(0,first.startFrame+omitted),full.channels[ch].subarray(0,first.startFrame+omitted));
  assert.notDeepEqual(partial.channels[ch].subarray(first.startFrame+omitted,first.endFrame),full.channels[ch].subarray(first.startFrame+omitted,first.endFrame));
  assert.deepEqual(partial.channels[ch].subarray(first.endFrame),full.channels[ch].subarray(first.endFrame));
 }
 const expected=[new Float64Array(p.frames),new Float64Array(p.frames)];
 for(const v of p.voices){const stem=renderTineLiveRecord(p.bodies[v.body]).channels[0];for(let ch=0;ch<2;ch++){
  const gain=(ch?Math.sin:Math.cos)((v.pan+1)*Math.PI/4)*v.gain;
  for(let i=0;i<stem.length;i++)expected[ch][v.startFrame+i]+=stem[i]*gain;
 }}
 assert.deepEqual(partial.channels,expected.map(c=>Float32Array.from(c)));
 const single={...source,events:[source.events[0]]};
 assert.deepEqual(renderLivingAnswerStudy(single,'spaced').channels,renderLivingAnswerStudy(single,'fragment').channels);
});
