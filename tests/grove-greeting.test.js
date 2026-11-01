import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove,GROVE_SEEDS} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveGreetingPlan,groveGreetingFrames} from '../src/grove/greeting.js';
import {createGroveSession} from '../src/grove/session.js';
import {createGroveVoiceSession} from '../src/grove/voice-session.js';
test('both page greetings admit every scheduled event and retain positions in the captured timeline',()=>{
 for(const seed of GROVE_SEEDS)for(const sampleRate of [44100,48000])for(const voice of [null,DEFAULT_VOICE_CONFIG]){
  const grove=composeGrove({seed}),plan=createGroveGreetingPlan(grove,voice),events=groveGreetingFrames(plan,sampleRate),session=voice?createGroveVoiceSession({grove,voice},sampleRate):createGroveSession(grove,sampleRate);
  for(const event of events)assert.equal(session.strike(event).accepted,true,`${seed}/${sampleRate}/${!!voice}`);
  const record=session.snapshot();assert.equal(record.events.length,voice?15:12);assert.ok(events.at(-1).frame/sampleRate<plan.duration);assert.equal(plan.sections.at(-1).id,'silence');
  if(voice){assert.deepEqual(record.events.slice(0,6).map(e=>e.strikeU),[.3,.3,.6,.6,1,1]);assert.ok(record.events.slice(-3).every(e=>e.frame===record.events.at(-1).frame));}
  else assert.ok(record.events.every(e=>!Object.hasOwn(e,'position')));
 }
});
