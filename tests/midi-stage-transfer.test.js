import test from 'node:test';
import assert from 'node:assert/strict';
import {saveMidiStage,readMidiStage,midiComposition} from '../src/midi/stage-transfer.js';
import {parseSMF} from '../src/midi/smf.js';
import {exampleMidiBytes} from '../src/midi/preview.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {createImportedPerformance} from '../src/stage/imported-performance.js';
const input=()=>({version:1,source:{name:'triad.mid',bytes:53,sha256:'0'.repeat(64)},notes:parseSMF(exampleMidiBytes()),plan:{version:1,window:{startSeconds:0,endSeconds:.75},lead:.35,tailSeconds:4,velocityCurve:'linear',assignments:[{track:0,channel:'all',family:'bellows',sustainPedal:false}]}});
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('session transfers isolate imported passages and reject missing or invalid data',()=>{
 const store=storage(),a=input(),b=input();b.plan.lead=.7;
 saveMidiStage(store,a,'a');saveMidiStage(store,b,'b');a.plan.lead=2;
 assert.equal(readMidiStage(store,'a').plan.lead,.35);assert.equal(readMidiStage(store,'b').plan.lead,.7);
 assert.throws(()=>readMidiStage(store,'missing'),/not available/);
 assert.throws(()=>readMidiStage(store,'../a'),/Invalid/);
 store.setItem('imagimusic.midi.bad','{}');assert.throws(()=>readMidiStage(store,'bad'));
 assert.throws(()=>saveMidiStage({setItem(){throw new Error('quota');}},b,'c'),/quota/);
});
test('only resolved, audible mappings can be transferred; child selection follows compiled entrances',()=>{
 const data=input(),store=storage();data.plan.assignments=[];
 assert.throws(()=>saveMidiStage(store,data,'x'),/Assign/);
 data.plan.assignments=[{track:0,channel:'all',family:'none'}];assert.throws(()=>saveMidiStage(store,data,'x'),/playable/);
 for(const family of ['bellows','loom','fm']){
  const data=input();data.plan.assignments=[{track:0,channel:'all',family,...(family==='bellows'?{sustainPedal:false}:family==='loom'?{loomBody:{rule:'parity'}}:{})}];
  saveMidiStage(store,data,family);const restored=readMidiStage(store,family),composition=midiComposition(restored);
  assert.equal(composition.loom.enabled,family==='loom');assert.equal(composition.fm.enabled,family==='fm');
  for(const sr of [44100,48000]){const p=createImportedPerformance(DEFAULT_PATCH,restored,composition,sr);assert.ok(p.mappingReport.onsets>0);assert.equal(!!p.loom,family==='loom');assert.equal(!!p.fm,family==='fm');}
 }
});
