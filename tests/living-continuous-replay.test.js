import test from 'node:test';
import assert from 'node:assert/strict';
import {setupContinuousReturnReplay} from '../src/living/continuous-return-replay.js';
function fixture(){
 const element=()=>({value:'',hidden:true,paused:true,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},fire(type){return this.handlers[type]?.();},removeAttribute(key){delete this[key];},load(){}});
 const elements=Object.fromEntries(['file','prepare','cancel','listen','quiet','audio','status','wav','json'].map(key=>[key,element()]));
 const source={kind:'imagimusic-continuous-tine-record',sampleRate:48000,events:[]},artifact={kind:'imagimusic-continuous-return-audio',version:1,sampleRate:48000,frames:1200,record:source,wav:new ArrayBuffer(4858)};
 let next=()=>Promise.resolve(artifact),prepares=0,plays=0,cancels=0,coordinations=0;const blobs=[],revoked=[];
 const player={async prepare(){prepares++;},async play(){plays++;elements.audio.paused=false;return true;},park(){elements.audio.paused=true;},async resume(){},setDb(value){this.db=value;}};
 const replay=setupContinuousReturnReplay({elements,getSource:()=>source,beforePlay:()=>coordinations++,createPlayer:()=>player,createJob:()=>({promise:next(),cancel(){cancels++;}}),makeURL:blob=>{blobs.push(blob);return `blob:${blobs.length}`;},revokeURL:url=>revoked.push(url)});
 return {elements,artifact,replay,blobs,revoked,player,setNext:fn=>next=fn,get prepares(){return prepares;},get plays(){return plays;},get cancels(){return cancels;},get coordinations(){return coordinations;}};
}
test('preparing stays silent; explicit replay coordinates audio, while failed replacement retains both downloads',async()=>{
 const f=fixture();await f.elements.prepare.fire('click');assert.equal(f.prepares,0);assert.equal(f.plays,0);assert.equal(f.elements.listen.disabled,false);assert.equal(f.elements.wav.href,'blob:1');
 await f.elements.listen.fire('click');assert.equal(f.prepares,1);assert.equal(f.plays,1);assert.equal(f.elements.audio.hidden,false);assert.equal(f.coordinations,2);
 f.setNext(()=>Promise.reject(Error('Invalid saved body')));await f.elements.prepare.fire('click');assert.equal(f.elements.wav.href,'blob:1');assert.deepEqual(f.revoked,[]);assert.equal(f.elements.listen.disabled,false);
 f.setNext(()=>Promise.resolve(f.artifact));await f.elements.prepare.fire('click');assert.deepEqual(f.revoked,['blob:1','blob:2']);f.replay.dispose();assert.deepEqual(f.revoked,['blob:1','blob:2','blob:3','blob:4']);
});
test('cancellation suppresses late preparation and file size is checked before reading',async()=>{
 const f=fixture();let resolve;f.setNext(()=>new Promise(r=>resolve=r));const pending=f.elements.prepare.fire('click');await Promise.resolve();f.elements.cancel.fire('click');resolve(f.artifact);await pending;
 assert.equal(f.blobs.length,0);assert.equal(f.cancels,1);
 let reads=0;f.elements.file.files=[{size:512*1024+1,async text(){reads++;return '{}';}}];await f.elements.file.fire('change');assert.equal(reads,0);assert.match(f.elements.status.textContent,/512 KiB/);
});
test('invalid worker output leaves old recording and explicit level routing intact',async()=>{
 const f=fixture();await f.elements.prepare.fire('click');f.setNext(()=>Promise.resolve({...f.artifact,frames:999}));await f.elements.prepare.fire('click');assert.equal(f.elements.wav.href,'blob:1');assert.match(f.elements.status.textContent,/Invalid prepared/);
 f.replay.setDb(8);assert.equal(f.player.db,8);
});
