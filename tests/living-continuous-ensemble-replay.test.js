import test from 'node:test';
import assert from 'node:assert/strict';
import {setupContinuousEnsembleReplay} from '../src/living/continuous-ensemble-replay.js';
import {prepareContinuousEnsembleAudio} from '../src/living/continuous-ensemble-audio.js';
import {createTineDesign} from '../src/tine/address.js';
import {CONTINUOUS_ENSEMBLE_RECORD_LIMIT} from '../src/living/continuous-ensemble-record.js';
function fixture(){
 const element=()=>({value:'',hidden:true,paused:true,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},fire(type){return this.handlers[type]?.();},removeAttribute(key){delete this[key];},load(){}});
 const elements=Object.fromEntries(['file','prepare','cancel','listen','quiet','audio','status','wav','json'].map(key=>[key,element()]));
 const source={kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records:[80,95,65].map(lengthMm=>({kind:'imagimusic-continuous-tine-record',version:1,design:createTineDesign({lengthMm}),sampleRate:48000,events:[],fadeStart:0}))},artifact=prepareContinuousEnsembleAudio(JSON.stringify(source));
 let next=()=>Promise.resolve(artifact),prepares=0,plays=0,cancels=0,coordinations=0;const blobs=[],revoked=[];
 const player={async prepare(){prepares++;},async play(){plays++;elements.audio.paused=false;return true;},park(){elements.audio.paused=true;},async resume(){},setDb(value){this.db=value;}};
 const replay=setupContinuousEnsembleReplay({elements,getSource:()=>source,beforePlay:()=>coordinations++,createPlayer:()=>player,createJob:()=>({promise:next(),cancel(){cancels++;}}),makeURL:blob=>{blobs.push(blob);return `blob:${blobs.length}`;},revokeURL:url=>revoked.push(url)});
 return {elements,artifact,replay,blobs,revoked,player,setNext:fn=>next=fn,get prepares(){return prepares;},get plays(){return plays;},get cancels(){return cancels;},get coordinations(){return coordinations;}};
}
test('preparing stays silent; explicit replay coordinates audio, while failed replacement retains both downloads',async()=>{
 const f=fixture();assert.equal(f.replay.prepared,null);await f.elements.prepare.fire('click');const copy=f.replay.prepared;assert.equal(copy.identity,'blob:1');copy.record.records.length=0;assert.equal(f.replay.prepared.record.records.length,3);assert.equal(f.prepares,0);assert.equal(f.plays,0);assert.equal(f.elements.listen.disabled,false);assert.equal(f.elements.wav.href,'blob:1');
 await f.elements.listen.fire('click');assert.equal(f.prepares,1);assert.equal(f.plays,1);assert.equal(f.elements.audio.hidden,false);assert.equal(f.coordinations,2);
 f.setNext(()=>Promise.reject(Error('Invalid saved body')));await f.elements.prepare.fire('click');assert.equal(f.elements.wav.href,'blob:1');assert.equal(f.replay.prepared.identity,'blob:1');assert.deepEqual(f.revoked,[]);assert.equal(f.elements.listen.disabled,false);
 f.setNext(()=>Promise.resolve(f.artifact));await f.elements.prepare.fire('click');assert.deepEqual(f.revoked,['blob:1','blob:2']);f.replay.dispose();assert.equal(f.replay.prepared,null);assert.deepEqual(f.revoked,['blob:1','blob:2','blob:3','blob:4']);
});
test('cancellation suppresses late preparation and file size is checked before reading',async()=>{
 const f=fixture();let resolve;f.setNext(()=>new Promise(r=>resolve=r));const pending=f.elements.prepare.fire('click');await Promise.resolve();f.elements.cancel.fire('click');resolve(f.artifact);await pending;
 assert.equal(f.blobs.length,0);assert.equal(f.cancels,1);
 let reads=0;f.elements.file.files=[{size:CONTINUOUS_ENSEMBLE_RECORD_LIMIT+1,async text(){reads++;return '{}';}}];await f.elements.file.fire('change');assert.equal(reads,0);assert.match(f.elements.status.textContent,/1,537 KiB/);
});
test('invalid worker output leaves old recording and explicit level routing intact',async()=>{
 const f=fixture();await f.elements.prepare.fire('click');f.setNext(()=>Promise.resolve({...f.artifact,frames:999}));await f.elements.prepare.fire('click');assert.equal(f.elements.wav.href,'blob:1');assert.match(f.elements.status.textContent,/Invalid prepared/);
 f.replay.setDb(8);assert.equal(f.player.db,8);
});

test('ensemble replay refuses a single voice or mismatched body ending without replacing the prior mix',async()=>{
 const f=fixture();await f.elements.prepare.fire('click');
 for(const mutate of [x=>x.kind='imagimusic-continuous-return-audio',x=>x.record.records[1].fadeStart=1,x=>x.record.mixGain=1]){
  const changed=structuredClone(f.artifact);mutate(changed);f.setNext(()=>Promise.resolve(changed));await f.elements.prepare.fire('click');assert.equal(f.elements.wav.href,'blob:1');assert.deepEqual(f.revoked,[]);assert.match(f.elements.status.textContent,/Invalid prepared/);
 }
});
