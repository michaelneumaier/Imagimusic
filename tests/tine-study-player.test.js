import test from 'node:test';import assert from 'node:assert/strict';
import {createTineStudyPlayer} from '../src/tine/study-player.js';
function fixture(resume){let contexts=0,sources=0;const levels=[],audio={src:'',plays:0,pauses:0,play:async()=>{audio.plays++;},pause:()=>audio.pauses++},context={state:'running',destination:{},createMediaElementSource(){sources++;return {connect(){}};},resume:resume??(()=>Promise.resolve()),suspend:async()=>{context.state='suspended';}},player=createTineStudyPlayer({audio,createContext:()=>{contexts++;return context;},createStage:(_,options)=>{levels.push(options.db);return {input:{},output:{connect(){}},setDb:db=>levels.push(db)};}});return {player,audio,context,levels,counts:()=>({contexts,sources})};}
test('one explicit listening level persists across body switches without modifying source URLs',async()=>{
 const f=fixture();f.player.setDb(12);assert.equal(f.audio.plays,0);await f.player.play('opening.wav');f.player.setDb(20);await f.player.play('wider.wav');assert.deepEqual(f.counts(),{contexts:1,sources:1});assert.equal(f.audio.src,'wider.wav');assert.deepEqual(f.levels,[12,20]);assert.equal(f.player.db,20);assert.throws(()=>f.player.setDb(21));assert.equal(f.player.db,20);
});
test('page-away cancels a pending resume without late playback or an automatic return',async()=>{
 let resolve;const f=fixture(()=>new Promise(r=>resolve=r)),pending=f.player.play('opening.wav');f.player.park();resolve();assert.equal(await pending,false);assert.equal(f.audio.plays,0);assert.equal(f.audio.src,'');
});
test('a stale play completion cannot pause the newer selected body',async()=>{
 const f=fixture(),resolve=[];f.audio.play=()=>new Promise(r=>resolve.push(r));
 const first=f.player.play('opening.wav');await Promise.resolve();const second=f.player.play('wider.wav');await Promise.resolve();const pauses=f.audio.pauses;
 resolve[0]();assert.equal(await first,false);assert.equal(f.audio.pauses,pauses);resolve[1]();assert.equal(await second,true);assert.equal(f.audio.src,'wider.wav');
});
