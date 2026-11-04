import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingJourneyMovieSession} from '../src/living/journey-movie-session.js';
const selection={request:{kind:'imagimusic-living-journey-request',version:1,seed:42,treatment:'connected'},reveal:true};
const result={blob:new Blob(['movie double'],{type:'video/mp4'}),wav:new ArrayBuffer(44),report:{seed:42},manifest:{duration:40.20625},stem:'test'};
function setup(overrides={}){
 const revoked=[],created=[];let index=0;
 const session=createLivingJourneyMovieSession({createJob:()=>({promise:Promise.resolve({sha256:'a'.repeat(64)}),cancel(){}}),exportMovie:async()=>result,makeURL:blob=>{const url=`blob:${++index}`;created.push({url,blob});return url;},revokeURL:url=>revoked.push(url),...overrides});
 return {session,revoked,created};
}
test('successful films replace four links atomically while failures preserve the last result',async()=>{
 let fail=false;const {session,revoked,created}=setup({exportMovie:async()=>{if(fail)throw Error('encoder failure');return result;}});
 const first=await session.prepare(selection);assert.equal(first.links.length,4);assert.equal(session.busy,false);
 fail=true;await assert.rejects(session.prepare(selection),/encoder failure/);assert.equal(session.current,first);assert.deepEqual(revoked,[]);
 fail=false;const next=await session.prepare(selection);assert.equal(session.current,next);assert.deepEqual(revoked,first.links.map(l=>l.href));assert.equal(created.length,8);
});
test('Quiet during worker or late export leaves no URLs and refuses overlapping work',async()=>{
 for(const stage of ['worker','export']){
  let release,entered,cancels=0;const ready=new Promise(resolve=>entered=resolve);
  const {session,created}=setup(stage==='worker'?{createJob:()=>({promise:new Promise(resolve=>{release=()=>resolve({});entered();}),cancel:()=>cancels++})}:{exportMovie:()=>new Promise(resolve=>{release=()=>resolve(result);entered();})});
  const pending=session.prepare(selection);await ready;
  await assert.rejects(session.prepare(selection),/already/);session.cancel();release();
  await assert.rejects(pending,{name:'AbortError'});assert.equal(session.busy,false);assert.equal(session.current,null);assert.deepEqual(created,[]);
  assert.equal(cancels,stage==='worker'?1:0);
 }
});
test('partial download allocation rolls back and kept-audio mismatch never enters encoder',async()=>{
 let attempts=0,ids=0,fail=false;const revoked=[];
 const {session}=setup({makeURL:()=>{attempts++;if(fail&&attempts===2)throw Error('URL failure');return `blob:${++ids}`;},revokeURL:url=>revoked.push(url)});
 const first=await session.prepare(selection);fail=true;attempts=0;
 // Fail after one successful URL rather than replacing the prior film.
 await assert.rejects(session.prepare(selection),/URL failure/);
 assert.equal(session.current,first);assert.equal(revoked.length,1);
 let encoded=false;const second=setup({exportMovie:async()=>{encoded=true;return result;}}).session;
 await assert.rejects(second.prepare({...selection,expectedSha256:'b'.repeat(64)}),/kept recording/);assert.equal(encoded,false);
});
