import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingGreeting} from '../src/living/greeting.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
test('authored greeting is a fresh bounded source with a three-touch motif and exact solo return',()=>{
 const a=createLivingGreeting(),b=createLivingGreeting();assert.notEqual(a,b);assert.notEqual(a.events,b.events);assert.deepEqual(a,b);
 assert.deepEqual(a.events.map(e=>[e.frame/a.sampleRate,e.strength]),[[.5,.1],[1.15,.025],[2.2,.05]]);
 const pcm=renderLivingArrangement(a);assert.equal(pcm.seconds,15.1);assert.equal(pcm.plan.voices.length,5);
 for(const channel of pcm.channels)assert.deepEqual(channel.slice(0,pcm.plan.phraseFrames),channel.slice(pcm.plan.returnStart));
});
