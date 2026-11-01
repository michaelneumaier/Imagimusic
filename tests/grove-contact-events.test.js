import test from 'node:test';
import assert from 'node:assert/strict';
import {createContactEventQueue} from '../src/grove/contact-events.js';
test('sample events retain simultaneous order and are independent of render block sizes',()=>{
 function render(blocks){
  const queue=createContactEventQueue(),commands={third:()=>value+=3,strike:()=>value+=2,rest:()=>value*=.5};let value=0,cursor=0;const samples=[],applied=[];
  queue.enqueue('third',8);queue.enqueue('strike',2);queue.enqueue('rest',2);
  for(const size of blocks)for(let i=0;i<size;i++,cursor++){queue.applyThrough(cursor,event=>{commands[event.id]();applied.push(event);});samples.push(value);value*=.9;}
  return {samples,applied};
 }
 const one=render([12]),split=render([1,3,2,6]);assert.deepEqual(split,one);assert.equal(one.samples[2],1);assert.deepEqual(one.applied.map(e=>[e.id,e.appliedFrame,e.lateByFrames]),[['strike',2,0],['rest',2,0],['third',8,0]]);
});
test('late arrivals acknowledge the actual application sample and cannot rewrite history',()=>{
 const queue=createContactEventQueue(),acks=[];queue.applyThrough(128,()=>{});queue.enqueue('late',12);queue.applyThrough(256,event=>acks.push(event));
 assert.deepEqual(acks.map(({requestedFrame,appliedFrame,lateByFrames})=>({requestedFrame,appliedFrame,lateByFrames})),[{requestedFrame:12,appliedFrame:256,lateByFrames:244}]);assert.equal(queue.applyThrough(257,()=>assert.fail('double application')),0);assert.throws(()=>queue.applyThrough(255,()=>{}),/backwards/);assert.throws(()=>queue.enqueue('late',300),/Duplicate/);
});
test('queue bounds reject before changing accepted events and fresh passages have independent identities',()=>{
 const queue=createContactEventQueue({capacity:1,maxEvents:2});queue.enqueue('one',4);assert.throws(()=>queue.enqueue('two',5),/capacity/);assert.equal(queue.scheduled,1);queue.applyThrough(4,()=>{});queue.enqueue('two',5);queue.applyThrough(5,()=>{});assert.throws(()=>queue.enqueue('three',6),/capacity/);assert.throws(()=>queue.enqueue('bad',Infinity),/safe integer/);assert.throws(()=>queue.enqueue('',7),/ID/);assert.equal(queue.pending,0);
 const fresh=createContactEventQueue();fresh.enqueue('one',0);assert.equal(fresh.pending,1);
});
test('late events colliding on one applied frame expose their actual application order for replay',()=>{
 const queue=createContactEventQueue(),acks=[];queue.enqueue('requested-later',20);queue.enqueue('requested-earlier',10);queue.applyThrough(128,event=>acks.push(event));
 assert.deepEqual(acks.map(e=>[e.id,e.appliedFrame,e.order,e.arrivalOrder]),[['requested-earlier',128,0,1],['requested-later',128,1,0]]);
 const replay=acks.slice().sort((a,b)=>a.appliedFrame-b.appliedFrame||a.order-b.order);assert.deepEqual(replay.map(e=>e.id),acks.map(e=>e.id));
});
