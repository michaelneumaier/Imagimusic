import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSMF} from '../src/midi/smf.js';
import {exampleMidiBytes} from '../src/midi/preview.js';
import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_TENSIONER} from '../src/fm.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';
import {createImportedPerformance} from '../src/stage/imported-performance.js';
import {createStageFrames} from '../src/stage/frame.js';

const ensemble=()=>({...structuredClone(DEFAULT_COMPOSITION),version:2,loom:{...structuredClone(DEFAULT_COMPOSITION.loom),enabled:true},fm:{enabled:true,settings:{...DEFAULT_TENSIONER}}});
const input=()=>({version:1,source:{name:'triad.mid',bytes:53,sha256:'0'.repeat(64)},notes:parseSMF(exampleMidiBytes()),
  plan:{version:1,window:{startSeconds:0,endSeconds:.75},lead:.35,tailSeconds:4,velocityCurve:'linear',assignments:[{track:0,channel:'all',family:'bellows',sustainPedal:false}]}});

test('imported base-only score disables absent children without changing caller settings or inventing entrances',()=>{
  const data=input(),composition=ensemble(),before=JSON.stringify({data,composition});
  for(const sr of [44100,48000]){
    const p=createImportedPerformance(DEFAULT_PATCH,data,composition,sr);
    assert.equal(p.loom,undefined);assert.equal(p.fm,undefined);
    assert.deepEqual(p.childrenDisabledByImport,['loom','fm']);
    assert.equal(p.composition.loom.enabled,false);assert.equal(p.composition.fm.enabled,false);
    assert.deepEqual(p.composition.loom.settings,composition.loom.settings);
    assert.equal(p.events.length,3);assert.equal(p.mappingReport.counts.exact,3);
    assert.deepEqual(p.events.map(e=>e.voice.scoreId),['midi:1','midi:2','midi:3']);
    assert.ok(p.events.every(e=>e.voice.noteOn===.35&&e.voice.noteOff===.85));
    assert.ok(p.duration>=5.1);
    const frames=createStageFrames(p),camera={mode:'manual',position:[9,6,12],target:[0,1,0]};
    assert.equal(frames.sample(p.duration,camera).voices.length,0);
  }
  assert.equal(JSON.stringify({data,composition}),before);
  const copy=createImportedPerformance(DEFAULT_PATCH,data,composition);
  data.plan.lead=2;data.notes.notes[0].pitch=1;composition.fm.settings.carrierHz=440;
  assert.equal(copy.imported.plan.lead,.35);assert.equal(copy.imported.notes.notes[0].pitch,60);
  assert.equal(copy.composition.fm.settings.carrierHz,220);
});

test('assigned optional children use exactly their imported events and require explicit enablement',()=>{
  const data=input();data.notes.tracks[0].channels=[0,1,2];
  data.notes.notes.forEach((n,i)=>n.channel=i);
  data.plan.assignments=[{track:0,channel:0,family:'garden',gardenUnplayable:'drop'},
    {track:0,channel:1,family:'loom',loomBody:{rule:'parity'}},{track:0,channel:2,family:'fm'}];
  assert.throws(()=>createImportedPerformance(DEFAULT_PATCH,data),/Enable/);
  const composition=ensemble();composition.fm.enabled=false;
  assert.throws(()=>createImportedPerformance(DEFAULT_PATCH,data,composition),/FM tensioner/);
  const p=createImportedPerformance(DEFAULT_PATCH,data,ensemble());
  assert.deepEqual(p.childrenDisabledByImport,[]);
  assert.equal(p.events.length,1);assert.equal(p.events[0].family,'garden');
  assert.deepEqual(p.loom.events.map(e=>e.time),[.35]);assert.equal(p.fm.time,.35);
  assert.deepEqual(p.mappingReport.children,{loom:true,fm:true});
  assert.ok(p.duration>=Math.max(p.loom.duration,p.fm.duration));
  const frames=createStageFrames(p),camera={mode:'cinematic'};
  const forward=[0,.35,.5,1,p.duration].map(t=>frames.sample(t,camera));
  for(let i=forward.length-1;i>=0;i--)assert.deepEqual(frames.sample([0,.35,.5,1,p.duration][i],camera),forward[i]);
});

test('unresolved assignments cannot become a performance; explicit omission can produce silence',()=>{
  const data=input();data.plan.assignments=[];
  assert.throws(()=>createImportedPerformance(DEFAULT_PATCH,data),/3 notes still need/);
  data.plan.assignments=[{track:0,channel:'all',family:'none'}];
  const p=createImportedPerformance(DEFAULT_PATCH,data,ensemble());
  assert.equal(p.events.length,0);assert.equal(p.mappingReport.counts.dropped,3);
  assert.equal(p.loom,undefined);assert.equal(p.fm,undefined);assert.equal(p.duration,5.1);
});
