import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createLivingJourneyMedia} from '../src/living/journey-media.js';

const plan={kind:'fixture',seed:42},bytes=new Uint8Array([1,2,3,4]);
const report=()=>({plan,previewGain:8,sha256:createHash('sha256').update(bytes).digest('hex')});
function fixture({manifest=report(),payload=bytes}={}){
 const made=[],revoked=[],requests=[];
 const media=createLivingJourneyMedia({fetchFile:async(url,options)=>{requests.push({url,options});return url.endsWith('.json')?new Response(JSON.stringify(manifest)):new Response(payload);},makeURL:blob=>{made.push(blob);return `blob:${made.length}`;},revokeURL:url=>revoked.push(url)});
 return {media,made,revoked,requests};
}
test('only matching plan and WAV bytes receive a playable URL, with replacement and cleanup',async()=>{
 const f=fixture();assert.equal(await f.media.prepare('piece.wav',plan),'blob:1');
 assert.deepEqual(new Uint8Array(await f.made[0].arrayBuffer()),bytes);
 assert.ok(f.requests.every(r=>r.options.cache==='no-store'));
 assert.equal(await f.media.prepare('piece.wav',plan),'blob:2');assert.deepEqual(f.revoked,['blob:1']);
 f.media.clear();f.media.clear();assert.deepEqual(f.revoked,['blob:1','blob:2']);
});
test('stale score, wrong gain and changed audio fail without creating a URL',async()=>{
 for(const options of [{manifest:{...report(),plan:{...plan,seed:43}}},{manifest:{...report(),previewGain:1}},{payload:new Uint8Array([4,3,2,1])}]){
  const f=fixture(options);await assert.rejects(f.media.prepare('piece.wav',plan),/score|report/);assert.equal(f.made.length,0);
 }
});
test('cancelling during hashing blocks a late playable URL',async()=>{
 let finish,entered;const ready=new Promise(resolve=>entered=resolve);let made=0;
 const media=createLivingJourneyMedia({fetchFile:async url=>url.endsWith('.json')?new Response(JSON.stringify(report())):new Response(bytes),digest:()=>{entered();return new Promise(resolve=>finish=resolve);},makeURL:()=>{made++;return 'blob:late';}});
 const pending=media.prepare('piece.wav',plan);await ready;media.cancel();finish(createHash('sha256').update(bytes).digest());
 await assert.rejects(pending,{name:'AbortError'});assert.equal(made,0);
});
