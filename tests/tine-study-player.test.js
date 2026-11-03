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

test('failed media-source creation can retry on the retained context with the chosen level',async()=>{
 let contexts=0,attempts=0,plays=0;const levels=[],audio={src:'',pause(){},async play(){plays++;}},source={connect(){},disconnect(){}};
 const context={state:'running',destination:{},async resume(){},async suspend(){},createMediaElementSource(){if(attempts++===0)throw Error('source unavailable');return source;}};
 const player=createTineStudyPlayer({audio,createContext:()=>{contexts++;return context;},createStage:(_,options)=>{levels.push(options.db);return {input:{},output:{connect(){}},setDb(){},dispose(){}};}});
 player.setDb(14);await assert.rejects(player.play('opening.wav'),/source unavailable/);assert.equal(audio.src,'');assert.equal(plays,0);
 assert.equal(await player.play('pulse.wav'),true);assert.equal(audio.src,'pulse.wav');assert.equal(plays,1);assert.equal(contexts,1);assert.equal(attempts,2);assert.deepEqual(levels,[14]);
});
test('failed stage connection is disposed and retried without replacing the media source or bypassing gain',async()=>{
 let sources=0,attempts=0,disposals=0,disconnects=0,plays=0;const levels=[],audio={src:'',pause(){},async play(){plays++;}};
 const source={connect(){},disconnect(){disconnects++;}},context={state:'running',destination:{},async resume(){},createMediaElementSource(){sources++;return source;}};
 const player=createTineStudyPlayer({audio,createContext:()=>context,createStage:(_,options)=>{levels.push(options.db);return {input:{},output:{connect(){if(attempts++===0)throw Error('output unavailable');}},setDb(){},dispose(){disposals++;}};}});
 player.setDb(8);await assert.rejects(player.play('opening.wav'),/output unavailable/);assert.equal(disposals,1);assert.equal(disconnects,1);assert.equal(plays,0);assert.equal(audio.src,'');
 player.setDb(16);assert.equal(await player.play('phrase.wav'),true);assert.equal(sources,1);assert.deepEqual(levels,[8,16]);assert.equal(plays,1);assert.equal(audio.src,'phrase.wav');
});
