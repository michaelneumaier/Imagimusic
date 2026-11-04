import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineDesign} from '../src/tine/address.js';
import {renderTineLiveRecord} from '../src/tine/live-record.js';
import {renderLivingPersonalJourneyArtifact} from '../src/living/personal-journey-artifact.js';
import {personalOriginalWav} from '../src/living/personal-original.js';
import {setupPersonalOriginalListening} from '../src/living/personal-original-listening.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:28800,strength:.1},{frame:48000,strength:.05}],fadeStart:120000};
test('original preview is every PCM16 sample of the isolated journey opening at both production rates',async()=>{
 for(const rate of [44100,48000]){
  const record={...source,sampleRate:rate,events:source.events.map(e=>({...e,frame:Math.round(e.frame*rate/48000)})),fadeStart:Math.round(source.fadeStart*rate/48000)};
  const pcm=renderTineLiveRecord(record),wav=personalOriginalWav(pcm,record);
  const journey=await renderLivingPersonalJourneyArtifact({kind:'imagimusic-living-personal-journey-request',version:1,source:record});
  assert.equal(wav.byteLength,44+pcm.frames*4);
  assert.deepEqual(new Uint8Array(wav,44),new Uint8Array(journey.wav,44,pcm.frames*4));
 }
 const pcm=renderTineLiveRecord(source);
 assert.throws(()=>personalOriginalWav({...pcm,frames:1},source),/match/);
 pcm.channels[0][10]=NaN;assert.throws(()=>personalOriginalWav(pcm,source),/headroom/);
});
function setup(overrides={}){
 const make=()=>({paused:true,hidden:true,handlers:{},addEventListener(t,f){(this.handlers[t]??=[]).push(f);},async fire(t){await Promise.all((this.handlers[t]??[]).map(f=>f()));},removeAttribute(){},load(){}});
 const elements={audio:make(),listen:make(),quiet:make(),status:make()},revoked=[],calls=[];let jobs=0,urls=0;
 const player={prepare:async()=>{},play:async url=>{calls.push(url);elements.audio.paused=false;await elements.audio.fire('play');return true;},resume:async()=>{},stop:()=>{elements.audio.paused=true;},park:()=>calls.push('park'),setDb:v=>calls.push(v)};
 const controls=setupPersonalOriginalListening({elements,getSource:()=>source,beforePlay:()=>calls.push('coordinate'),createPlayer:()=>player,createJob:()=>{jobs++;return {promise:Promise.resolve(renderTineLiveRecord(source)),cancel(){}};},makeURL:()=>`blob:${++urls}`,revokeURL:u=>revoked.push(u),...overrides});
 return {elements,controls,revoked,calls,get jobs(){return jobs;}};
}
test('audition coordinates playback, reuses its recording, and clears URLs on a source change',async()=>{
 const s=setup();await s.elements.listen.fire('click');assert.equal(s.controls.active,true);assert.equal(s.elements.quiet.disabled,false);
 assert.equal(s.jobs,1);s.controls.stop();assert.equal(s.controls.active,false);
 await s.elements.listen.fire('click');assert.equal(s.jobs,1);assert.equal(s.calls.filter(x=>x==='coordinate').length,4);
 s.controls.setDb(6);s.controls.park();assert.ok(s.calls.includes(6));assert.ok(s.calls.includes('park'));
 s.controls.clear();assert.deepEqual(s.revoked,['blob:1']);assert.equal(s.elements.audio.hidden,true);
});
test('Quiet during worker preparation ignores late completion without publishing audio',async()=>{
 let release,entered,cancels=0,urls=0;const ready=new Promise(r=>entered=r);
 const s=setup({createJob:()=>({promise:new Promise(resolve=>{release=resolve;entered();}),cancel:()=>cancels++}),makeURL:()=>{urls++;return 'late';}});
 const pending=s.elements.listen.fire('click');await ready;s.controls.stop();release(renderTineLiveRecord(source));await pending;
 assert.equal(s.elements.status.textContent,'Original paused.');assert.equal(cancels,1);assert.equal(urls,0);assert.equal(s.controls.active,false);assert.equal(s.elements.audio.hidden,true);
});
