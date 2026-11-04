import test from 'node:test';
import assert from 'node:assert/strict';
import {setupContinuousReturnControls} from '../src/living/continuous-return-controls.js';
function fixture(){
 const make=()=>({disabled:false,hidden:true,value:'.05',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},fire(type,event={}){return this.handlers[type]?.(event);}});
 const elements=Object.fromEntries(['start','quiet','pad','strength','seed','mode','status','count','download','result'].map(name=>[name,make()]));elements.seed.value='42';elements.mode.value='fixed';
 let notify,gate=null;const calls=[],blobs=[],revoked=[];
 const session={state:'idle',async start(seed,options){this.options=options;calls.push(['start',seed]);this.state='playing';notify({state:this.state});},async strike(strength){calls.push(['strike',strength]);if(gate)await gate;},async quiet(){calls.push(['quiet']);this.state='ending';notify({state:this.state});},park(){calls.push(['park']);this.state='interrupted';notify({state:this.state});},dispose(){},setListeningDb(value){calls.push(['level',value]);},time(){return 12;}};
 const controls=setupContinuousReturnControls({elements,createSession:options=>{notify=options.onChange;return session;},makeURL:blob=>{blobs.push(blob);return `blob:${blobs.length}`;},revokeURL:url=>revoked.push(url)});
 return {elements,session,calls,blobs,revoked,controls,emit(event){session.state=event.state;notify(event);},setGate(value){gate=value;}};
}
test('listening requires only Start; touch counts use accepted events, and Quiet requests an ending',async()=>{
 const f=fixture();assert.equal(f.elements.pad.disabled,true);assert.equal(f.calls.length,0);
 await f.elements.start.fire('click');assert.deepEqual(f.calls,[['start',42]]);assert.equal(f.elements.start.disabled,true);assert.equal(f.elements.seed.disabled,true);
 await f.elements.pad.fire('click');assert.equal(f.elements.count.textContent,'0 notes · 0 from you');
 f.emit({state:'playing',events:[{origin:'score'},{origin:'guest'}]});assert.equal(f.elements.count.textContent,'1 note · 1 from you');
 await f.elements.quiet.fire('click');assert.deepEqual(f.calls.at(-1),['quiet']);assert.equal(f.elements.pad.disabled,true);
});
test('only completed verification replaces a download; failure retains the existing capture',async()=>{
 const f=fixture(),record={kind:'imagimusic-continuous-tine-record',events:[],sampleRate:48000},finished={seed:42,record,snapshot:{endFrame:1200}};
 f.emit({state:'verifying'});assert.equal(f.blobs.length,0);assert.equal(f.elements.quiet.textContent,'Cancel keeping');
 f.emit({state:'ended',finished});assert.deepEqual(JSON.parse(await f.blobs[0].text()),record);assert.equal(f.elements.download.hidden,false);assert.match(f.elements.result.textContent,/0.03 seconds/);
 await f.elements.start.fire('click');f.emit({state:'error',message:'Failed replacement'});assert.equal(f.elements.download.href,'blob:1');assert.deepEqual(f.revoked,[]);
 f.emit({state:'ended',finished});assert.equal(f.elements.download.href,'blob:2');assert.deepEqual(f.revoked,['blob:1']);
 f.controls.dispose();assert.deepEqual(f.revoked,['blob:1','blob:2']);
});
test('pending touch and modified/repeated keys cannot enqueue extra inputs',async()=>{
 const f=fixture();await f.elements.start.fire('click');let release;f.setGate(new Promise(resolve=>release=resolve));
 const event={key:'1',preventDefault(){}};f.elements.pad.fire('keydown',{...event,repeat:true});f.elements.pad.fire('keydown',{...event,ctrlKey:true});assert.equal(f.calls.length,1);
 const pending=f.elements.pad.fire('keydown',event);await f.elements.pad.fire('click');assert.equal(f.calls.length,2);assert.deepEqual(f.calls[1],['strike',.025]);
 f.controls.stop();release();await pending;assert.equal(f.elements.pad.disabled,true);assert.equal(f.controls.state,'interrupted');
});
test('verification cancellation parks the session, while level and time stay delegated',async()=>{
 const f=fixture();f.emit({state:'verifying'});await f.elements.quiet.fire('click');assert.deepEqual(f.calls,[['park']]);assert.equal(f.blobs.length,0);
 f.controls.setDb(6);assert.deepEqual(f.calls.at(-1),['level',6]);assert.equal(f.controls.time(),12);
});

test('remembered mode is fixed per run and does not require a contribution',async()=>{
 const f=fixture();f.elements.mode.value='memory';await f.elements.start.fire('click');
 assert.deepEqual(f.session.options,{mode:'memory'});assert.equal(f.controls.mode,'memory');assert.equal(f.controls.memoryTouches,0);assert.equal(f.elements.mode.disabled,true);
 f.elements.mode.value='fixed';assert.equal(f.controls.mode,'memory');
 f.emit({state:'playing',events:[{origin:'guest',frame:0},{origin:'guest',frame:288000},{origin:'guest',frame:1},{origin:'guest',frame:2},{origin:'guest',frame:3}]});
 assert.equal(f.controls.memoryTouches,3);f.controls.stop();assert.equal(f.elements.mode.disabled,false);
 await f.elements.start.fire('click');assert.deepEqual(f.session.options,{mode:'fixed'});assert.equal(f.controls.memoryTouches,0);
});
