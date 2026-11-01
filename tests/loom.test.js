import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLoom,loomEnvelope,renderLoom,stereoWav} from '../src/loom/model.js';
test('Loom stereo pickup is deterministic and silent on an uncoupled unstruck body',()=>{
 const study=makeLoom({coupling:0});study.duration=1;
 const a=renderLoom(study,12000),b=renderLoom(study,12000);assert.deepEqual(a,b);
 assert.ok(a.channels[0].some(v=>Math.abs(v)>.05));assert.ok(a.channels[1].every(v=>v===0));
 assert.deepEqual(loomEnvelope(study,.1).slice(1),[0]);
 const wav=new DataView(stereoWav(a));assert.equal(wav.getUint16(22,true),2);assert.equal(wav.getUint32(24,true),12000);assert.equal(wav.getUint32(40,true),12000*4);
});
test('coupled stereo samples preserve signed normal-mode interference and the shared normalization',()=>{
 const study=makeLoom();study.duration=2;const pcm=renderLoom(study,12000);
 const peak=Math.max(...[0,1].flatMap(body=>study.response.bodyModes(body).map(m=>Math.abs(m.amplitude))));
 for(const i of [10,100,500,5000,12000]){
  const t=i/12000,x=study.response.x(t),env=loomEnvelope(study,t);
  for(let body=0;body<2;body++){
   assert.ok(Math.abs(pcm.channels[body][i]-.45*.19*x[body]/peak)<2e-8);
   assert.ok(Math.abs(pcm.channels[body][i])<=.45*env[body]+2e-8);
  }
 }
 assert.ok(Math.max(...loomEnvelope(study,.6))>0);
 assert.ok(pcm.channels.every(c=>c.every(Number.isFinite)));
 assert.ok(pcm.channels.every(c=>Math.abs(c.at(-1))<.001));
 assert.throws(()=>makeLoom({coupling:NaN}));assert.throws(()=>makeLoom({},2));
});
