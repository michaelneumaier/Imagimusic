import test from 'node:test';
import assert from 'node:assert/strict';
import {bindHoldControl} from '../src/grove/hold-control.js';
function fixture(){
 const button=new EventTarget(),windowTarget=new EventTarget(),changes=[],captured=new Set();
 button.disabled=false;button.focus=()=>{};button.setPointerCapture=id=>captured.add(id);button.hasPointerCapture=id=>captured.has(id);button.releasePointerCapture=id=>{captured.delete(id);send('lostpointercapture',{pointerId:id});};
 const control=bindHoldControl(button,{windowTarget,onChange:held=>changes.push(held)});
 function send(type,data={},target=button){const event=new Event(type,{cancelable:true});Object.assign(event,data);target.dispatchEvent(event);return event;}
 return {button,windowTarget,changes,captured,control,send};
}
test('overlapping pointers, keyboard and assistive activation keep contact until the last owner releases',()=>{
 const f=fixture();
 f.send('pointerdown',{button:0,pointerId:1});f.send('pointerdown',{button:0,pointerId:2});
 f.send('keydown',{key:' ',repeat:false});f.send('click',{detail:0});
 f.send('pointerup',{pointerId:1});f.send('pointercancel',{pointerId:2});f.send('keyup',{key:' '});
 assert.deepEqual(f.changes,[true]);assert.equal(f.control.requested,true);
 f.send('click',{detail:0});assert.deepEqual(f.changes,[true,false]);f.control.dispose();
});
test('capture loss, keyboard blur and window blur release only their appropriate ownership, once',()=>{
 const f=fixture();f.send('pointerdown',{button:0,pointerId:1});f.send('keydown',{key:'Enter',repeat:false});
 f.send('blur');assert.deepEqual(f.changes,[true]);f.send('lostpointercapture',{pointerId:1});assert.deepEqual(f.changes,[true,false]);
 f.send('pointerdown',{button:0,pointerId:2});f.send('keydown',{key:' ',repeat:false});f.send('blur',{},f.windowTarget);
 assert.deepEqual(f.changes,[true,false,true,false]);assert.equal(f.captured.has(2),false);
 f.send('keyup',{key:' '});f.send('pointerup',{pointerId:2});assert.equal(f.changes.length,4);f.control.dispose();
});
test('disabled/repeated/right-button input, failed pointer capture and synthetic pointer click cannot create stuck contacts',()=>{
 const f=fixture();f.button.disabled=true;f.send('keydown',{key:' ',repeat:false});f.send('click',{detail:0});f.send('pointerdown',{button:0,pointerId:1});
 f.button.disabled=false;f.send('keydown',{key:'Enter',repeat:true});f.send('pointerdown',{button:2,pointerId:2});f.send('click',{detail:1});
 f.button.setPointerCapture=()=>{throw new Error('pointer gone');};f.send('pointerdown',{button:0,pointerId:3});
 assert.deepEqual(f.changes,[]);assert.equal(f.control.requested,false);f.control.dispose();
});
test('reset after an audio failure clears ownership without another request; disposal releases and removes all listeners',()=>{
 const f=fixture();f.send('pointerdown',{button:0,pointerId:1});f.control.reset();assert.deepEqual(f.changes,[true]);assert.equal(f.control.requested,false);assert.equal(f.captured.size,0);
 f.send('keydown',{key:' ',repeat:false});f.control.dispose();assert.deepEqual(f.changes,[true,true,false]);
 f.send('click',{detail:0});f.send('keydown',{key:'Enter',repeat:false});f.control.dispose();assert.deepEqual(f.changes,[true,true,false]);
});
