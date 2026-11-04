import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneyContinuation} from '../src/living/journey-continuation.js';
function setup(personal){
 const state={hidden:false,starting:false,ended:true,personal},tasks=[],events=[];
 const continuation=createJourneyContinuation({state:()=>state,repeat:()=>events.push('repeat'),fresh:()=>events.push('fresh'),schedule:(fn,ms)=>{tasks.push({fn,ms});return tasks.length;},cancel:()=>{}});
 return {state,tasks,events,continuation};
}
test('personal endings repeat while generated endings create a fresh piece, only after opt-in and a pause',()=>{
 for(const personal of [false,true]){
  const {continuation:c,tasks,events}=setup(personal);
  c.queue();assert.equal(tasks.length,0);c.enable();assert.equal(tasks.length,0);
  c.queue();assert.equal(tasks[0].ms,3000);assert.deepEqual(events,[]);
  tasks[0].fn();assert.deepEqual(events,[personal?'repeat':'fresh']);assert.equal(c.enabled,true);
  c.queue();tasks[1].fn();assert.equal(events.length,2);
 }
});
test('a changed playback state at the end of the pause prevents either continuation',()=>{
 for(const personal of [false,true])for(const [key,value] of [['hidden',true],['starting',true],['ended',false]]){
  const {state,continuation:c,tasks,events}=setup(personal);c.enable();c.queue();state[key]=value;
  tasks[0].fn();assert.deepEqual(events,[]);assert.equal(c.enabled,false);
 }
});
test('stopping for a source change defeats a stale repeat without opting into fresh generated music',()=>{
 const {state,continuation:c,tasks,events}=setup(true);c.enable();c.queue();c.stop();state.personal=false;
 tasks[0].fn();c.queue();assert.deepEqual(events,[]);assert.equal(tasks.length,1);
 c.enable();c.queue();tasks[1].fn();assert.deepEqual(events,['fresh']);
});
