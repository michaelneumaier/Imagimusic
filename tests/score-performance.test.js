import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_TENSIONER} from '../src/fm.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';
import {createScorePerformance,readScoreSearch,scoreURL} from '../src/stage/score-performance.js';
const score={version:1,seed:1,tempo:120,beatsPerBar:4,lead:.35,controls:{density:.7,character:'calm'},sections:[{id:'opening',beats:[0,4],cadence:'anticipation'},{id:'exchange',beats:[4,8],cadence:'answer'},{id:'release',beats:[8,12],cadence:'settling'}],hold:8,events:[{id:'garden:opening:1',family:'garden',beat:0,slot:2,velocity:.5,position:.1,anchor:true},{id:'bellows:exchange:1',family:'bellows',beat:4,noteMidi:60,durationBeats:1,velocity:.4,anchor:true},{id:'fm:exchange:1',family:'fm',beat:5,anchor:true},{id:'loom:release:1',family:'loom',beat:8,body:1,velocity:.5,anchor:true}]};
const composition={...structuredClone(DEFAULT_COMPOSITION),version:2,loom:{...DEFAULT_COMPOSITION.loom,enabled:true},fm:{enabled:true,settings:{...DEFAULT_TENSIONER}}};
test('saved score drives tempo, seed, explicit entrances and complete sound settings',()=>{
 const p=createScorePerformance(DEFAULT_PATCH,score,composition);
 assert.equal(p.patch.seed,1);assert.equal(p.patch.tempo,120);
 assert.equal(p.events[1].voice.noteOn,2.35);assert.equal(p.events[1].voice.noteOff,2.85);
 assert.equal(p.fm.time,2.85);assert.equal(p.loom.events[0].time,4.35);
 assert.equal(p.events[0].voice.position,.1);assert.equal(DEFAULT_PATCH.seed,731);
 const again=createScorePerformance(p.patch,JSON.parse(JSON.stringify(p.score)),p.composition);
 assert.equal(JSON.stringify(again),JSON.stringify(p));
 p.score.events[0].velocity=.1;assert.equal(score.events[0].velocity,.5);assert.equal(p.events[0].voice.velocity,.5);
});
test('score links round-trip complete canonical data and preserve the instrument and arrangement',()=>{
 const url=new URL(scoreURL('http://localhost/stage.html?instrument=lab&loom=1#world',score));
 assert.deepEqual(readScoreSearch(url.search),score);
 assert.equal(url.searchParams.get('instrument'),'lab');assert.equal(url.searchParams.get('loom'),'1');assert.equal(url.hash,'#world');
 const cleared=new URL(scoreURL(url,null));assert.equal(readScoreSearch(cleared.search),null);assert.equal(cleared.searchParams.get('loom'),'1');
 for(const value of ['oops','null',JSON.stringify({...score,unexpected:1})])assert.throws(()=>readScoreSearch('?score='+encodeURIComponent(value)),/Invalid score/);
});

test('movie proof reconstructs the saved score and rejects omitted or changed authoring data',async()=>{
 const {createStageFrames}=await import('../src/stage/frame.js');
 const {createTraceManifest}=await import('../src/stage/manifest.js');
 const {verifyStageManifest}=await import('../tools/verify-stage-manifest.mjs');
 const p=createScorePerformance(DEFAULT_PATCH,score,composition),frames=createStageFrames(p),camera={mode:'follow',position:[9,6.5,12],target:[0,1,0]};
 const m={...createTraceManifest({...p,duration:7},{project:f=>frames.project(f,camera)}),instrument:p.patch,composition:p.composition,score:p.score,camera,width:1280,height:720,videoDuration:7,codecs:{video:'avc',audio:'aac'}};
 assert.equal(verifyStageManifest(m).valid,true);
 const omitted=structuredClone(m);delete omitted.score;assert.equal(verifyStageManifest(omitted).valid,false);
 const changed=structuredClone(m);changed.score.events[0].position=.8;assert.equal(verifyStageManifest(changed).valid,false);
 const wrongTempo=structuredClone(m);wrongTempo.instrument.tempo=84;assert.throws(()=>verifyStageManifest(wrongTempo),/same seed and tempo/);
});

test('authored sections use exact half-open boundaries during reverse seeking',async()=>{
 const {createStageFrames}=await import('../src/stage/frame.js');
 const frames=createStageFrames(createScorePerformance(DEFAULT_PATCH,score,composition)),camera={mode:'manual',position:[9,6.5,12],target:[0,1,0]};
 assert.equal(frames.sample(0,camera).global.score.id,'pre-roll');
 for(const [t,id] of [[.35,'opening'],[2.35,'exchange'],[4.35,'release'],[6.35,'tail'],[.35,'opening']])assert.equal(frames.sample(t,camera).global.score.id,id);
 });

test('a score without Loom strikes cannot silently invent an enabled Loom passage',()=>{
 const noLoom={...structuredClone(score),events:score.events.filter(e=>e.family!=='loom')};
 assert.throws(()=>createScorePerformance(DEFAULT_PATCH,noLoom,composition),/no Loom strikes/);
 const disabled={...composition,loom:{...composition.loom,enabled:false}};
 const passage=createScorePerformance(DEFAULT_PATCH,noLoom,disabled);
 assert.equal(passage.loom,undefined);assert.equal(passage.fm.time,2.85);
});
