import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingConnectedJourneyStudy,renderLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {renderLivingArrangementBody} from '../src/living/arrangement.js';

test('connected journey retains every exchange and its internal timing, with one opening and return',()=>{
 for(const seed of [0,42,2950288811,0xffffffff]){
  const p=createLivingConnectedJourneyStudy(seed),basis=createLivingJourneyStudy(seed);
  assert.deepEqual(p,createLivingConnectedJourneyStudy(seed));
  assert.equal(p.voices.length,17);
  assert.equal(p.voices.filter(v=>v.part==='opening').length,1);
  assert.equal(p.voices.filter(v=>v.part==='return').length,1);
  for(let i=0;i<p.sections.length;i++){
   const section=p.sections[i],voices=p.voices.filter(v=>v.section===i),original=basis.sections[i].arrangement.voices.filter(v=>v.part===voices[0].part);
   assert.deepEqual(section.source,basis.sections[i].source);
   const offset=voices[0].startFrame-original[0].startFrame;
   voices.forEach((v,k)=>{
    assert.deepEqual(v,{...original[k],section:i,startFrame:original[k].startFrame+offset,endFrame:original[k].endFrame+offset});
    assert.ok(v.startFrame>=0&&Number.isInteger(v.startFrame)&&v.endFrame<=p.frames);
   });
   if(i>0&&i<6){
    assert.equal(section.firstTouchFrame-p.sections[i-1].lastTouchFrame,Math.round((i===1?1.8:.55)*p.sampleRate));
    if(i>1)assert.ok(section.firstTouchFrame<p.sections[i-1].endFrame,'previous ring continues into next chapter');
   }
  }
  assert.deepEqual(p.sections[0].source,p.sections.at(-1).source);
  assert.ok(p.voices.at(-1).startFrame>=Math.max(...p.voices.slice(0,-1).map(v=>v.endFrame)),'return is isolated from previous tails');
  assert.ok(p.frames<basis.frames);
 }
});

test('connected PCM retains exact isolated opening/return and sums full tails across boundaries',()=>{
 const pcm=renderLivingConnectedJourneyStudy(42),p=pcm.plan;
 const stems=p.sections.map(s=>s.arrangement.bodies.map((_,i)=>renderLivingArrangementBody(s.arrangement,i).channels[0]));
 assert.ok(pcm.peak>0&&pcm.peak<1);
 const opening=p.voices[0],home=p.voices.at(-1);
 for(const c of pcm.channels){
  const first=c.subarray(opening.startFrame,opening.endFrame),last=c.subarray(home.startFrame,home.endFrame);
  assert.equal(first.length,last.length);
  assert.ok(first.every((sample,i)=>sample===last[i]),'opening and final return samples are identical');
 }
 // Independently evaluate samples immediately around all chapter joins,
 // including overlapping previous tails and each stem's final fade.
 const probes=new Set();
 for(const s of p.sections)for(const center of [s.startFrame,s.firstTouchFrame,s.endFrame])for(let d=-3;d<=3;d++)probes.add(center+d);
 for(const f of probes){
  if(f<0||f>=p.frames)continue;
  for(let ch=0;ch<2;ch++){
   let expected=0;
   for(const v of p.voices){
    const local=f-v.startFrame;
    if(local<0||local>=stems[v.section][v.body].length)continue;
    const angle=(v.pan+1)*Math.PI/4;
    expected+=stems[v.section][v.body][local]*((ch===0?Math.cos(angle):Math.sin(angle))*v.gain);
   }
   assert.equal(pcm.channels[ch][f],Math.fround(expected));
  }
 }
});
