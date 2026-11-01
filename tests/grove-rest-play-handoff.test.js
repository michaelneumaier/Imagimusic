import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {encodeRestPlayHandoff,readRestPlayHandoff,writeRestPlayHandoff} from '../src/grove/rest-play-handoff.js';
const id='12345678-1234-1234-1234-123456789abc';
function pair(){const original={grove:composeGrove({seed:3}),voice:DEFAULT_VOICE_CONFIG};const changed=structuredClone(original);changed.grove.bridges[0].coupling*=1.2;return {original:{record:original},changed:{record:changed}};}
test('handoff carries both exact structures and saved voice without gestures or source sample rate',()=>{
 const p=pair();p.original.record.events=[{private:'gesture'}];p.original.record.sampleRate=8000;
 let saved;const storage={setItem(k,v){saved=v;},getItem(){return saved;}};
 assert.equal(writeRestPlayHandoff(storage,p,id),`rest.html?instrument=${id}`);
 const result=readRestPlayHandoff(storage,id);
 assert.deepEqual(result.original,p.original.record.grove);assert.deepEqual(result.changed,p.changed.record.grove);assert.deepEqual(result.voice,DEFAULT_VOICE_CONFIG);
 assert.equal(saved.includes('private'),false);assert.equal(saved.includes('sampleRate'),false);
 p.changed.record.grove.bridges[0].coupling=.01;assert.notEqual(result.changed.bridges[0].coupling,.01);
});
test('unavailable, stale, oversized, mismatched or unsupported handoffs never silently select the seed',()=>{
 assert.throws(()=>readRestPlayHandoff({getItem:()=>null},id),/no longer/);
 assert.throws(()=>readRestPlayHandoff({getItem:()=>encodeRestPlayHandoff(pair(),id)},'aaaaaaaa-1234-1234-1234-123456789abc'),/newer/);
 assert.throws(()=>readRestPlayHandoff({getItem:()=> ' '.repeat(16385)},id),/no longer/);
 const p=pair();p.changed.record.grove.loss*=1.01;assert.throws(()=>encodeRestPlayHandoff(p,id),/only/);
 const v=pair();v.original.record.voice={...DEFAULT_VOICE_CONFIG,positions:[.3,.4,.6,1]};v.changed.record.voice=v.original.record.voice;assert.throws(()=>encodeRestPlayHandoff(v,id),/positions/);
 assert.throws(()=>writeRestPlayHandoff({setItem(){throw new Error('storage unavailable');}},pair(),id),/storage unavailable/);
});
