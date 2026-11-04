import test from 'node:test';
import assert from 'node:assert/strict';
import {setupContinuousEnsembleControls} from '../src/living/continuous-ensemble-controls.js';
function fixture({whole=false,mode=false,continued=false}={}){
 const make=()=>({disabled:false,hidden:true,value:'42',handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},fire(type,event={}){return this.handlers[type]?.(event);}});
 const elements={...Object.fromEntries(['start','quiet','seed','status','count','result','strength'].map(name=>[name,make()])),downloads:[make(),make(),make()],pads:[make(),make(),make()]};elements.strength.value='.05';
 elements.seed.options=['42','2950288811','4294967295'].map(value=>({value}));if(continued){elements.continueListening=make();elements.continueListening.checked=true;}
 if(whole)elements.whole=make();if(mode){elements.mode=make();elements.mode.value='memory';}
 const calls=[],blobs=[],revoked=[],options=[],tasks=new Map();let taskId=0,visible=true,startFailure=false;let notify,failAt=-1,gate=null;
 const session={state:'idle',touches:0,async start(seed,settings){if(startFailure)throw Error('Audio resume refused');options.push(['audio',settings]);calls.push(['start',seed]);this.state='playing';notify({state:this.state,touches:0});},async strike(body,strength){calls.push(['strike',body,strength]);if(gate)await gate;},async quiet(){calls.push(['quiet']);this.state='ending';notify({state:this.state,touches:0});},park(){calls.push(['park']);this.state='interrupted';notify({state:this.state,touches:0});},dispose(){},time(){return 12;},setListeningDb(value){calls.push(['level',value]);}};
 const visual={begin:(seed,settings)=>{options.push(['visual',settings]);calls.push(['visual',seed]);},update(){},stop:()=>calls.push(['visual-stop'])};
 const controls=setupContinuousEnsembleControls({elements,visual,schedule:(fn,ms)=>{const id=++taskId;tasks.set(id,{fn,ms});return id;},cancel:id=>tasks.delete(id),isVisible:()=>visible,createSession:options=>{notify=options.onChange;return session;},makeURL:blob=>{if(blobs.length===failAt)throw Error('URL failed');blobs.push(blob);return `blob:${blobs.length}`;},revokeURL:url=>revoked.push(url)});
 return {elements,calls,blobs,revoked,controls,options,tasks,setStartFailure(value){startFailure=value;},setVisible(value){visible=value;},async next(){const [id,task]=tasks.entries().next().value;tasks.delete(id);task.fn();await Promise.resolve();},emit(event){session.state=event.state;notify({touches:0,...event});},failNextAt(n){failAt=n;},setGate(value){gate=value;}};
}
const finished={seed:42,records:[80,95,65].map(lengthMm=>({kind:'imagimusic-continuous-tine-record',sampleRate:48000,design:{lengthMm},events:[]})),snapshot:[{endFrame:1200}]};
test('one Begin starts the picture and piece; Quiet is optional and seed stays fixed',async()=>{
 const f=fixture();assert.equal(f.calls.length,0);assert.equal(f.elements.quiet.disabled,true);
 await f.elements.start.fire('click');assert.deepEqual(f.calls,[['visual',42],['start',42]]);assert.equal(f.elements.start.disabled,true);assert.equal(f.elements.seed.disabled,true);
 await f.elements.start.fire('click');assert.equal(f.calls.length,2);f.emit({state:'playing',touches:3});assert.equal(f.elements.count.textContent,'3 accepted notes · 0 from you');
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

test('body buttons share a pending guard and keyboard strength applies only to the focused voice',async()=>{
 const f=fixture();assert.ok(f.elements.pads.every(p=>p.disabled));await f.elements.start.fire('click');let release;f.setGate(new Promise(resolve=>release=resolve));
 const pending=f.elements.pads[2].fire('click');assert.ok(f.elements.pads.every(p=>p.disabled));await f.elements.pads[0].fire('click');assert.deepEqual(f.calls.at(-1),['strike',2,.05]);assert.equal(f.calls.length,3);
 release();await pending;f.setGate(null);assert.ok(f.elements.pads.every(p=>!p.disabled));
 const key={key:'1',preventDefault(){}};await f.elements.pads[0].fire('keydown',{...key,repeat:true});assert.equal(f.calls.length,3);await f.elements.pads[0].fire('keydown',key);assert.deepEqual(f.calls.at(-1),['strike',0,.025]);
 f.emit({state:'playing',touches:1,events:[{origin:'guest'}]});assert.equal(f.elements.count.textContent,'1 accepted note · 1 from you');
 await f.elements.quiet.fire('click');assert.ok(f.elements.pads.every(p=>p.disabled));
});
test('stopping during a pending guest cannot re-enable controls from its late completion',async()=>{
 const f=fixture();await f.elements.start.fire('click');let release;f.setGate(new Promise(resolve=>release=resolve));const pending=f.elements.pads[1].fire('click');f.controls.stop();release();await pending;
 assert.ok(f.elements.pads.every(p=>p.disabled));assert.equal(f.controls.state,'interrupted');
});


test('optional remembered choice locks with playback and names answers only after early accepted input',async()=>{
 const f=fixture({mode:true});await f.elements.start.fire('click');assert.deepEqual(f.options,[['visual',{mode:'memory'}],['audio',{mode:'memory'}]]);assert.equal(f.elements.mode.disabled,true);assert.equal(f.controls.remembers,false);
 f.emit({state:'playing',events:[{origin:'guest',frame:288000}]});assert.equal(f.controls.remembers,false);
 f.controls.stop();assert.equal(f.elements.mode.disabled,false);await f.elements.start.fire('click');
 f.emit({state:'playing',events:[{origin:'guest',frame:0}]});assert.equal(f.controls.remembers,true);
 f.emit({state:'ended',finished});assert.equal(f.controls.remembers,true);assert.equal(f.elements.mode.disabled,false);
 f.elements.mode.value='fixed';await f.elements.start.fire('click');assert.equal(f.controls.remembers,false);f.emit({state:'playing',events:[{origin:'guest',frame:0}]});assert.equal(f.controls.remembers,false);
});


test('continued listening is opt-in and cycles the three gestures only after completed keeping',async()=>{
 const once=fixture();await once.elements.start.fire('click');once.emit({state:'ended',finished});assert.equal(once.tasks.size,0);
 const f=fixture({continued:true,mode:true});assert.equal(f.calls.length,0);await f.elements.start.fire('click');assert.equal(f.tasks.size,0);
 for(const [current,next] of [[42,'2950288811'],[2950288811,'4294967295'],[4294967295,'42']]){
  f.emit({state:'verifying'});assert.equal(f.tasks.size,0);f.emit({state:'ended',finished:{...finished,seed:current}});
  assert.equal(f.tasks.size,1);assert.equal([...f.tasks.values()][0].ms,3000);assert.equal(f.elements.quiet.textContent,'Stop listening');assert.equal(f.elements.quiet.disabled,false);assert.equal(f.elements.mode.disabled,true);
  await f.next();assert.equal(f.elements.seed.value,next);assert.deepEqual(f.calls.at(-1),['start',Number(next)]);assert.deepEqual(f.options.at(-1),['audio',{mode:'memory'}]);assert.equal(f.controls.remembers,false);
 }
 f.controls.dispose();assert.equal(f.elements.continueListening.checked,false);
});
test('unchecking lets current music finish; Quiet disarms both active and paused continuation',async()=>{
 const f=fixture({continued:true});await f.elements.start.fire('click');f.elements.continueListening.checked=false;f.elements.continueListening.fire('change');assert.equal(f.controls.state,'playing');f.emit({state:'ended',finished});assert.equal(f.tasks.size,0);
 f.elements.continueListening.checked=true;await f.elements.start.fire('click');await f.elements.quiet.fire('click');f.emit({state:'ended',finished});assert.equal(f.tasks.size,0);assert.equal(f.elements.continueListening.checked,false);
 f.elements.continueListening.checked=true;await f.elements.start.fire('click');f.emit({state:'ended',finished});const stale=[...f.tasks.values()][0].fn;await f.elements.quiet.fire('click');const count=f.calls.length;stale();assert.equal(f.calls.length,count);assert.equal(f.tasks.size,0);assert.equal(f.elements.start.disabled,false);
});
test('leaving, replay stop, disposal, failure and stale timers cannot restart listening',async()=>{
 for(const action of ['hidden','stop','dispose','error','unchecked']){
  const f=fixture({continued:true});await f.elements.start.fire('click');f.emit({state:'ended',finished});const stale=[...f.tasks.values()][0].fn;
  if(action==='hidden'){f.setVisible(false);await f.next();}
  if(action==='stop'){f.controls.stop();assert.match(f.elements.status.textContent,/Listening stopped/);}
  if(action==='dispose')f.controls.dispose();
  if(action==='error')f.emit({state:'error',message:'failed'});
  if(action==='unchecked'){f.elements.continueListening.checked=false;f.elements.continueListening.fire('change');}
  const before=f.calls.length;stale();assert.equal(f.calls.length,before);assert.equal(f.tasks.size,0);assert.equal(f.elements.continueListening.checked,false);
 }
 const failed=fixture({continued:true});await failed.elements.start.fire('click');failed.failNextAt(0);failed.emit({state:'ended',finished});assert.equal(failed.tasks.size,0);assert.equal(failed.elements.continueListening.checked,false);
});

test('a browser refusal on the next start disarms the sequence and preserves the kept piece',async()=>{
 const f=fixture({continued:true,whole:true});await f.elements.start.fire('click');f.emit({state:'ended',finished});const kept=f.elements.whole.href;f.setStartFailure(true);await f.next();
 assert.equal(f.tasks.size,0);assert.equal(f.elements.continueListening.checked,false);assert.match(f.elements.status.textContent,/resume refused/);assert.equal(f.elements.whole.href,kept);assert.equal(f.elements.start.disabled,false);
});
