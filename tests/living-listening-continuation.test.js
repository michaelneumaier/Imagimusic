import test from 'node:test';import assert from 'node:assert/strict';
import {createListeningContinuation} from '../src/living/listening-continuation.js';
function setup(){const tasks=new Map(),cancelled=[],events=[];let id=0;const sequence=createListeningContinuation({next:()=>events.push('next'),schedule:(fn,ms)=>{tasks.set(++id,{fn,ms});return id;},cancel:n=>cancelled.push(n)});return {sequence,tasks,cancelled,events};}
test('continuation is opt-in and schedules one next piece only after explicit completion',()=>{
 const {sequence:s,tasks,events}=setup();s.queue();assert.equal(tasks.size,0);s.enable();assert.equal(tasks.size,0);s.queue();s.queue();assert.equal(tasks.size,1);assert.equal(tasks.get(1).ms,3000);assert.equal(s.pending,true);tasks.get(1).fn();tasks.get(1).fn();assert.deepEqual(events,['next']);assert.equal(s.pending,false);assert.equal(s.enabled,true);assert.equal(tasks.size,1);s.queue();assert.equal(tasks.size,2);
});
test('Quiet, leaving and other owner cancellation defeat even an already queued callback',()=>{
 const {sequence:s,tasks,cancelled,events}=setup();s.enable();s.queue();const stale=tasks.get(1).fn;s.stop();assert.equal(s.enabled,false);assert.equal(s.pending,false);assert.deepEqual(cancelled,[1]);stale();assert.deepEqual(events,[]);s.enable();s.queue();stale();assert.deepEqual(events,[]);tasks.get(2).fn();assert.deepEqual(events,['next']);
});
test('a manual new piece can cancel the wait while preserving the chosen continuation mode',()=>{
 const {sequence:s,tasks,events}=setup();s.enable();s.queue();s.cancelPending();assert.equal(s.enabled,true);assert.equal(s.pending,false);tasks.get(1).fn();assert.deepEqual(events,[]);s.queue();tasks.get(2).fn();assert.deepEqual(events,['next']);
});

test('an owner cancellation during the firing notification prevents starting another piece',()=>{
 let fire,called=0,armed=false,sequence;
 sequence=createListeningContinuation({next:()=>called++,schedule:fn=>{fire=fn;return 1;},cancel:()=>{},onChange:()=>{if(armed&&!sequence.pending){armed=false;sequence.stop();}}});
 sequence.enable();sequence.queue();armed=true;fire();assert.equal(called,0);assert.equal(sequence.enabled,false);
});
