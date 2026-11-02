import test from 'node:test';
import assert from 'node:assert/strict';
import {bindBodyTap} from '../src/grove/body-tap.js';
function fixture({withResizeObserver=false}={}){
 const canvas=new EventTarget(),scope=new EventTarget(),document=new EventTarget(),a={},b={},played=[];
 let active=true,body=a,notifyResize,disconnected=false;
 if(withResizeObserver)scope.ResizeObserver=class{constructor(callback){notifyResize=callback;}observe(target){assert.equal(target,canvas);}disconnect(){disconnected=true;}};
 const binding=bindBodyTap(canvas,{scope,document,pick:()=>body,enabled:()=>active,onTap:value=>played.push(value)});
 function fire(type,{id=1,x=10,y=10,time=0,primary=true,button=0,target=canvas}={}){
  const event=new Event(type,{cancelable:true});
  for(const [key,value] of Object.entries({pointerId:id,clientX:x,clientY:y,timeStamp:time,isPrimary:primary,button,target}))Object.defineProperty(event,key,{value});
  if(type==='pointerdown'){scope.dispatchEvent(event);canvas.dispatchEvent(event);}
  else scope.dispatchEvent(event);
  assert.equal(event.defaultPrevented,false,'native scrolling/default interaction remains available');
 }
 return {canvas,scope,document,a,b,played,binding,fire,resize:()=>notifyResize(),get disconnected(){return disconnected;},setBody:value=>{body=value;},setActive:value=>{active=value;}};
}
test('only a short same-body primary tap calls the strike callback, once on release',()=>{
 const f=fixture();f.fire('pointerdown');assert.deepEqual(f.played,[]);
 f.fire('pointerup',{x:15,time:200});assert.deepEqual(f.played,[f.a]);
 f.fire('pointerup',{time:201});assert.equal(f.played.length,1);
 f.binding.dispose();
});
test('movement remains cancelled even if the pointer returns, and a hold is not a tap',()=>{
 const f=fixture();f.fire('pointerdown');f.fire('pointermove',{x:19});f.fire('pointermove',{x:10});f.fire('pointerup',{time:200});
 f.fire('pointerdown');f.fire('pointerup',{time:601});
 f.fire('pointerdown');f.fire('pointerup',{x:30,time:100});
 assert.deepEqual(f.played,[]);f.binding.dispose();
});
test('misses, another body, outside release, secondary buttons and closed gates do not play',()=>{
 const f=fixture();f.setBody(null);f.fire('pointerdown');f.setBody(f.a);f.fire('pointerup',{time:20});
 f.fire('pointerdown');f.setBody(f.b);f.fire('pointerup',{time:20});
 f.fire('pointerdown');f.fire('pointerup',{time:20,target:f.scope});
 f.fire('pointerdown',{button:2});f.fire('pointerup',{time:20});
 f.setActive(false);f.fire('pointerdown');f.setActive(true);f.fire('pointerup',{time:20});
 f.fire('pointerdown');f.setActive(false);f.fire('pointerup',{time:20});
 assert.deepEqual(f.played,[]);f.binding.dispose();
});
test('browser cancellation, scrolling, interruption, a second pointer and view changes cancel',()=>{
 const f=fixture();
 for(const type of ['pointercancel','scroll','resize','blur']){f.fire('pointerdown');f.scope.dispatchEvent(new Event(type));f.fire('pointerup',{time:20});}
 f.fire('pointerdown');f.document.dispatchEvent(new Event('visibilitychange'));f.fire('pointerup',{time:20});
 f.fire('pointerdown');f.fire('pointerdown',{id:2,primary:false});f.fire('pointerup',{time:20});
 f.fire('pointerup',{id:2,time:21});
 f.fire('pointerdown');f.fire('pointerdown',{id:2,primary:true});f.fire('pointerup',{id:2,time:20});f.fire('pointerup',{time:21});
 f.fire('pointerdown');f.binding.cancel();f.fire('pointerup',{time:20});
 assert.deepEqual(f.played,[]);
 f.binding.dispose();f.fire('pointerdown');f.fire('pointerup',{time:20});assert.deepEqual(f.played,[]);
});


test('a canvas size change cancels the press and disposal disconnects the observer',()=>{
 const f=fixture({withResizeObserver:true});f.fire('pointerdown');f.resize();f.fire('pointerup',{time:20});
 assert.deepEqual(f.played,[]);f.binding.dispose();assert.equal(f.disconnected,true);
});
