import test from 'node:test';
import assert from 'node:assert/strict';
import {createGroveReplay} from '../src/grove/replay.js';
function fixture(){const sources=[],copies=[];const context={state:'running',currentTime:2,destination:{},async resume(){},createBuffer:(count,length,sampleRate)=>({duration:length/sampleRate,copyToChannel:(samples,i)=>copies.push([i,[...samples]])}),createGain:()=>({gain:{cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}),createBufferSource(){const node={connect(){},disconnect(){},start(t){this.startTime=t;},stop(t){this.stopTime=t;}};sources.push(node);return node;}};const pcm={sampleRate:8000,channels:[Float32Array.of(0,.1,.2),Float32Array.of(0,.2,.1)]};return {context,sources,copies,pcm};}
test('replay copies the finished stereo mix without modifying it and uses audio-clock time',async()=>{
 const {context,sources,copies,pcm}=fixture(),before=structuredClone(pcm),player=createGroveReplay({createContext:()=>context});await player.play(pcm);assert.deepEqual(pcm,before);assert.deepEqual(copies[0][1],[...pcm.channels[0]]);assert.equal(sources[0].startTime,2.035);assert.equal(player.time(),0);context.currentTime=3;assert.equal(player.time(),3/8000);sources[0].onended();assert.equal(player.state,'ended');assert.equal(player.time(),3/8000);
});
test('Quiet supersedes a pending resume and stale ended callbacks cannot end a newer replay',async()=>{
 const {context,sources,pcm}=fixture();let resume;context.resume=()=>new Promise(r=>{resume=r;});const player=createGroveReplay({createContext:()=>context});const pending=player.play(pcm);player.stop();resume();await pending;assert.equal(sources.length,0);context.resume=async()=>{};await player.play(pcm);const old=sources[0];await player.play(pcm);old.onended();assert.equal(player.state,'playing');context.state='interrupted';context.onstatechange();assert.equal(player.state,'suspended');player.stop();assert.equal(player.state,'idle');assert.ok(sources[1].stopTime>context.currentTime);
});
test('deferred audio resumes inside the gesture and Quiet cancels preparation without starting sound',async()=>{
 const {context,sources,pcm}=fixture();let resolve,resumed=false;context.resume=async()=>{resumed=true;};const player=createGroveReplay({createContext:()=>context});const prepared=new Promise(r=>resolve=r),playing=player.play(prepared);assert.equal(resumed,true);await Promise.resolve();player.stop();resolve(pcm);await playing;assert.equal(sources.length,0);await player.play(Promise.resolve(pcm));assert.equal(sources.length,1);
});
test('parking releases the old audio context and a new user playback creates another',async()=>{
 const a=fixture(),b=fixture();let created=0,closed=0;a.context.close=b.context.close=async()=>{closed++;};const player=createGroveReplay({createContext:()=>++created===1?a.context:b.context});await player.play(a.pcm);player.park();assert.equal(player.state,'idle');assert.equal(closed,1);assert.equal(a.context.onstatechange,null);await player.play(b.pcm);assert.equal(created,2);assert.equal(b.sources.length,1);assert.equal(player.state,'playing');player.dispose();
});
test('declared replay listening stage is downstream of unchanged PCM and survives park as a preference only',async()=>{
 const {context,pcm,copies}=fixture(),stages=[],before=structuredClone(pcm);context.close=async()=>{};
 const player=createGroveReplay({createContext:()=>context,listeningDb:18,createListeningStage:(_,options)=>{const stage={initial:options.db,input:{},output:{connect(){}},setDb(db){this.db=db;},dispose(){this.disposed=true;}};stages.push(stage);return stage;}});
 await player.play(pcm);player.setListeningDb(9);assert.equal(stages[0].db,9);assert.deepEqual(pcm,before);assert.deepEqual(copies[0][1],[...pcm.channels[0]]);
 player.park();assert.equal(stages[0].disposed,true);await player.play(pcm);assert.equal(stages[1].initial,9);player.dispose();assert.equal(stages[1].disposed,true);
});
test('failed listening-stage setup can retry without silently playing the unboosted path',async()=>{
 const {context,pcm,sources}=fixture();context.close=async()=>{};let attempts=0,disposed=0;
 const player=createGroveReplay({createContext:()=>context,listeningDb:18,createListeningStage:()=>({input:{},output:{connect(){if(attempts++===0)throw new Error('connect failed');}},setDb(){},dispose(){disposed++;}})});
 await assert.rejects(player.play(pcm),/connect failed/);assert.equal(sources.length,0);assert.equal(disposed,1);await player.play(pcm);assert.equal(player.state,'playing');assert.equal(typeof context.onstatechange,'function');player.dispose();
});
