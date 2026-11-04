import test from 'node:test';
import assert from 'node:assert/strict';
import {setupContinuousEnsembleControls} from '../src/living/continuous-ensemble-controls.js';
function fixture({whole=false}={}){
 const make=()=>({disabled:false,hidden:true,value:'42',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},fire(type,event={}){return this.handlers[type]?.(event);}});
 const elements={...Object.fromEntries(['start','quiet','seed','status','count','result'].map(name=>[name,make()])),downloads:[make(),make(),make()]};
 if(whole)elements.whole=make();
 const calls=[],blobs=[],revoked=[];let notify,failAt=-1;
 const session={state:'idle',touches:0,async start(seed){calls.push(['start',seed]);this.state='playing';notify({state:this.state,touches:0});},async quiet(){calls.push(['quiet']);this.state='ending';notify({state:this.state,touches:0});},park(){calls.push(['park']);this.state='interrupted';notify({state:this.state,touches:0});},dispose(){},time(){return 12;},setListeningDb(value){calls.push(['level',value]);}};
 const visual={begin:seed=>calls.push(['visual',seed]),update(){},stop:()=>calls.push(['visual-stop'])};
 const controls=setupContinuousEnsembleControls({elements,visual,createSession:options=>{notify=options.onChange;return session;},makeURL:blob=>{if(blobs.length===failAt)throw Error('URL failed');blobs.push(blob);return `blob:${blobs.length}`;},revokeURL:url=>revoked.push(url)});
 return {elements,calls,blobs,revoked,controls,emit(event){session.state=event.state;notify({touches:0,...event});},failNextAt(n){failAt=n;}};
}
const finished={seed:42,records:[80,95,65].map(lengthMm=>({kind:'imagimusic-continuous-tine-record',sampleRate:48000,design:{lengthMm},events:[]})),snapshot:[{endFrame:1200}]};
test('one Begin starts the picture and piece; Quiet is optional and seed stays fixed',async()=>{
 const f=fixture();assert.equal(f.calls.length,0);assert.equal(f.elements.quiet.disabled,true);
 await f.elements.start.fire('click');assert.deepEqual(f.calls,[['visual',42],['start',42]]);assert.equal(f.elements.start.disabled,true);assert.equal(f.elements.seed.disabled,true);
 await f.elements.start.fire('click');assert.equal(f.calls.length,2);f.emit({state:'playing',touches:3});assert.equal(f.elements.count.textContent,'3 accepted notes');
 await f.elements.quiet.fire('click');assert.deepEqual(f.calls.at(-1),['quiet']);assert.equal(f.elements.quiet.disabled,true);
});
test('only verified completion creates three independent records; failed replacements retain them',async()=>{
 const f=fixture();f.emit({state:'verifying'});assert.equal(f.blobs.length,0);f.emit({state:'ended',finished});
 for(let i=0;i<3;i++){assert.deepEqual(JSON.parse(await f.blobs[i].text()),finished.records[i]);assert.equal(f.elements.downloads[i].hidden,false);assert.match(f.elements.downloads[i].download,new RegExp(`voice-${i+1}`));}
 const original=f.elements.downloads.map(link=>link.href);assert.match(f.elements.result.textContent,/0.03 seconds/);
 await f.elements.start.fire('click');f.emit({state:'error',message:'Failed'});assert.deepEqual(f.elements.downloads.map(link=>link.href),original);
 f.failNextAt(4);f.emit({state:'ended',finished});assert.deepEqual(f.elements.downloads.map(link=>link.href),original);assert.deepEqual(f.revoked,['blob:4']);assert.match(f.elements.status.textContent,/URL failed/);
 f.failNextAt(-1);f.emit({state:'ended',finished});assert.deepEqual(f.revoked,['blob:4','blob:1','blob:2','blob:3']);f.controls.dispose();assert.deepEqual(f.revoked.slice(-3),['blob:5','blob:6','blob:7']);
});
test('cancel keeping and stop park audio after holding its picture; level/time delegate',async()=>{
 const f=fixture();f.emit({state:'verifying'});assert.equal(f.elements.quiet.textContent,'Cancel keeping');await f.elements.quiet.fire('click');assert.deepEqual(f.calls,[['visual-stop'],['park']]);assert.equal(f.blobs.length,0);assert.equal(f.elements.seed.disabled,false);
 f.controls.setDb(6);assert.deepEqual(f.calls.at(-1),['level',6]);assert.equal(f.controls.time(),12);
});

test('whole-piece keep is atomic with the three component links',async()=>{
 const f=fixture({whole:true});f.emit({state:'ended',finished});
 const compound=JSON.parse(await f.blobs[3].text());assert.equal(compound.kind,'imagimusic-continuous-ensemble-record');assert.equal(compound.mixGain,1/3);assert.deepEqual(compound.records,finished.records);assert.equal(f.elements.whole.href,'blob:4');assert.equal(f.elements.whole.hidden,false);
 f.failNextAt(7);f.emit({state:'ended',finished});assert.deepEqual(f.revoked,['blob:5','blob:6','blob:7']);assert.equal(f.elements.whole.href,'blob:4');assert.equal(f.elements.downloads[0].href,'blob:1');
 f.controls.dispose();assert.deepEqual(f.revoked.slice(-4),['blob:1','blob:2','blob:3','blob:4']);
});
