import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createLivingJourneyGeneration} from '../src/living/journey-generation.js';

const plan={frames:1,sampleRate:48000},request={kind:'imagimusic-living-journey-request',version:1,seed:42,treatment:'evolving'};
function artifact(){const wav=new ArrayBuffer(48);return {kind:'imagimusic-living-journey-artifact',version:1,seed:42,treatment:'evolving',previewGain:8,sampleRate:48000,frames:1,plan,wav,sha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex')};}
function setup(){
 const jobs=[],blobs=[],revoked=[];
 const session=createLivingJourneyGeneration({createJob:()=>{let resolve;const promise=new Promise(r=>resolve=r),job={promise,resolve,cancel(){job.cancelled=true;}};jobs.push(job);return job;},makeURL:blob=>{blobs.push(blob);return 'blob:'+blobs.length;},revokeURL:url=>revoked.push(url)});
 return {session,jobs,blobs,revoked};
}
test('generated replay reuses verified URLs and selection releases both local downloads',async()=>{
 const f=setup(),pending=f.session.prepare(request,plan);f.jobs[0].resolve(artifact());const result=await pending;
 assert.equal(result.audioURL,'blob:1');assert.equal(result.reportURL,'blob:2');
 const report=JSON.parse(await f.blobs[1].text());assert.deepEqual(report.plan,plan);assert.equal(report.wav,undefined);
 assert.strictEqual(await f.session.prepare(request,plan),result);assert.equal(f.jobs.length,1);
 f.session.cancel();assert.deepEqual(f.revoked,[]);f.session.clear();f.session.clear();assert.deepEqual(f.revoked,['blob:1','blob:2']);
});
test('superseded worker cannot replace the selected journey or publish stale URLs',async()=>{
 const f=setup(),first=f.session.prepare(request,plan),rejected=assert.rejects(first,{name:'AbortError'}),second=f.session.prepare(request,plan);
 assert.equal(f.jobs[0].cancelled,true);f.jobs[0].resolve(artifact());await rejected;assert.equal(f.blobs.length,0);
 f.jobs[1].resolve(artifact());await second;assert.equal(f.blobs.length,2);
});
test('mismatched worker metadata or bytes cannot become playable downloads',async()=>{
 for(const alter of [a=>({...a,seed:43}),a=>({...a,plan:{...plan,frames:2}}),a=>({...a,wav:new ArrayBuffer(44)}),a=>({...a,sha256:'0'.repeat(64)})]){
  const f=setup(),pending=f.session.prepare(request,plan);f.jobs[0].resolve(alter(artifact()));await assert.rejects(pending,/match|identity/);assert.equal(f.blobs.length,0);
 }
});
test('Quiet during digest prevents publishing an already rendered result',async()=>{
 let finish,enter;const ready=new Promise(r=>enter=r);let made=0;
 const session=createLivingJourneyGeneration({createJob:()=>({promise:Promise.resolve(artifact()),cancel(){}}),digest:()=>{enter();return new Promise(r=>finish=r);},makeURL:()=>{made++;return 'blob:late';}});
 const pending=session.prepare(request,plan),rejected=assert.rejects(pending,{name:'AbortError'});await ready;session.cancel();finish(createHash('sha256').update(new Uint8Array(48)).digest());await rejected;assert.equal(made,0);
});

test('a kept digest is enforced even when the same unconstrained generation was cached',async()=>{
 const f=setup(),first=f.session.prepare(request,plan);f.jobs[0].resolve(artifact());await first;
 const restored=f.session.prepare(request,plan,'f'.repeat(64));f.jobs[1].resolve(artifact());
 await assert.rejects(restored,/kept audio exactly/);assert.equal(f.blobs.length,2);assert.deepEqual(f.revoked,[]);
 await assert.rejects(f.session.prepare(request,plan,'invalid'),/Invalid kept/);f.session.clear();
});
