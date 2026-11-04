import test from 'node:test';
import assert from 'node:assert/strict';
import {setupSharedPhraseControls,createSharedPhraseListeningStage} from '../src/living/shared-phrase-controls.js';
import {createTineDesign} from '../src/tine/address.js';
import {readTineLiveAddress} from '../src/tine/live-address.js';
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:0,strength:.025},{frame:24000,strength:.05}],fadeStart:120000};
function fixture(){
 const make=()=>({disabled:false,hidden:true,children:[],handlers:{},value:'.05',addEventListener(t,f){this.handlers[t]=f;},fire(t,event={}){return this.handlers[t]?.(event);},append(item){this.children.push(item);},replaceChildren(){this.children=[];},focus(){this.focused=true;}});
 const elements=Object.fromEntries(['start','pad','strength','quiet','status','history','download','replay','result'].map(k=>[k,make()]));
 const revoked=[],blobs=[],strikes=[];let notify,coordinations=0,startGate=null;
 const session={state:'idle',touches:0,async start(record,options){this.state='preparing';notify({state:this.state});if(startGate)await startGate;this.state='playing';notify({state:this.state});},async strike(value){strikes.push(value);this.touches++;notify({state:this.state,events:[{origin:'guest',frame:30000,strength:value}]});},async quiet(){this.state='ending';notify({state:this.state});},park(){this.state='interrupted';notify({state:this.state});},setListeningDb(value){this.db=value;}};
 const controls=setupSharedPhraseControls({elements,getSource:()=>source,beforePlay:()=>coordinations++,createSession:options=>{notify=options.onChange;assert.equal(options.listeningDb,0);return session;},createItem:make,makeURL:blob=>{blobs.push(blob);return `blob:${blobs.length}`;},revokeURL:url=>revoked.push(url)});
 return {elements,session,controls,revoked,blobs,strikes,emit:event=>notify(event),get coordinations(){return coordinations;},setStartGate:gate=>{startGate=gate;}};
}
test('start invites optional focused input, accepted touches are labelled, and only a completed record gets links',async()=>{
 const f=fixture();assert.equal(f.elements.pad.disabled,true);assert.equal(f.blobs.length,0);
 await f.elements.start.fire('click');assert.equal(f.coordinations,1);assert.equal(f.elements.pad.focused,true);
 await f.elements.pad.fire('click');assert.deepEqual(f.strikes,[.05]);assert.match(f.elements.history.children[0].textContent,/You · 0.625 s/);assert.equal(f.blobs.length,0);
 const record={...source,events:[...source.events,{frame:30000,strength:.05}]};f.session.state='ended';f.emit({state:'ended',finished:{record,snapshot:{guestTouches:1}}});
 assert.deepEqual(JSON.parse(await f.blobs[0].text()),record);assert.deepEqual(readTineLiveAddress(f.elements.replay.href.slice('tine-play.html'.length)),record);
 assert.equal(f.elements.download.hidden,false);assert.equal(f.elements.result.hidden,false);
 const href=f.elements.download.href;await f.elements.start.fire('click');f.session.state='error';f.emit({state:'error',message:'Injected failure'});assert.equal(f.elements.download.href,href);assert.deepEqual(f.revoked,[]);
 f.session.state='ended';f.emit({state:'ended',finished:{record:source,snapshot:{guestTouches:0}}});assert.deepEqual(f.revoked,['blob:1']);
});
test('Quiet requests a retained ending; interruption does not publish or refocus a late start',async()=>{
 const f=fixture();await f.elements.start.fire('click');await f.controls.quiet();assert.equal(f.session.state,'ending');assert.equal(f.controls.active,true);assert.equal(f.blobs.length,0);
 f.controls.stop();assert.equal(f.controls.active,false);f.controls.setDb(8);assert.equal(f.session.db,8);
 let release;const gate=new Promise(r=>release=r);f.setStartGate(gate);f.elements.pad.focused=false;
 const pending=f.elements.start.fire('click');f.controls.stop();release();await pending;assert.equal(f.elements.pad.focused,false);assert.equal(f.blobs.length,0);
});
test('focused number keys choose strength, ignore repeats/modifiers, and respect exhausted quota',async()=>{
 const f=fixture();await f.elements.start.fire('click');let prevented=0;
 const press=(key,extra={})=>f.elements.pad.fire('keydown',{key,preventDefault:()=>prevented++,...extra});
 press('1',{repeat:true});press('2',{ctrlKey:true});assert.deepEqual(f.strikes,[]);
 press('1');await Promise.resolve();press('3');await Promise.resolve();press('2');await Promise.resolve();
 assert.deepEqual(f.strikes,[.025,.1,.05]);assert.equal(f.elements.pad.disabled,true);press('1');assert.equal(f.strikes.length,3);assert.equal(prevented,4);
});
test('live shared listening uses fixed centered preview gain before the adjustable listening stage',()=>{
 const nodes=[];const node=()=>{const n={gain:{value:0,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(v){this.target=v;}},connect(to){this.to=to;},disconnect(){this.closed=true;}};nodes.push(n);return n;};
 const context={currentTime:0,createGain:node,createWaveShaper:node};const stage=createSharedPhraseListeningStage(context,{db:0});
 assert.equal(stage.input.gain.value,8/Math.sqrt(2));assert.equal(stage.input.to,nodes[0]);assert.equal(nodes[0].to,stage.output);
 stage.setDb(20);assert.equal(nodes[0].gain.target,10);assert.equal(stage.input.gain.value,8/Math.sqrt(2));stage.dispose();assert.ok(nodes.every(n=>n.closed));
});
