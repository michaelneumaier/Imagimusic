import test from 'node:test';import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveVoiceSession} from '../src/grove/voice-session.js';import {renderVoiceBank} from '../src/grove/voice-performance.js';import {mixImpulseRecording} from '../src/touch/session.js';
test('position gestures keep fixed gain and derive their buffer slot and strike coordinate',()=>{
 const session=createGroveVoiceSession({grove:composeGrove({seed:3}),voice:DEFAULT_VOICE_CONFIG},8000),gain=session.snapshot().outputGain;
 for(let position=0;position<3;position++){const result=session.strike({frame:position*16000,body:1,position,velocity:.7,bufferIndex:99,strikeU:.1});assert.ok(result.accepted);assert.equal(result.event.bufferIndex,position*3+1);assert.equal(result.event.strikeU,[.3,.6,1][position]);assert.equal(session.snapshot().outputGain,gain);}
 const copy=session.snapshot();copy.voice.positions[0]=.9;copy.events[0].position=2;assert.equal(session.snapshot().voice.positions[0],.3);assert.equal(session.snapshot().events[0].position,0);
 const frame=session.visual(2.5);session.visual(5);assert.deepEqual(session.visual(2.5),frame);session.finish(42000);assert.deepEqual(session.visual(6).envelope,[0,0,0]);
 assert.throws(()=>createGroveVoiceSession({grove:composeGrove({seed:3})},8000).strike({frame:0,body:1,position:3,velocity:.5}),/position/);
});
test('the saved multi-position passage uses its actual cached slots and recorded ending',()=>{
 const session=createGroveVoiceSession({grove:composeGrove({seed:7}),voice:DEFAULT_VOICE_CONFIG},8000);session.strike({frame:0,body:0,position:0,velocity:.5});session.strike({frame:1400,body:2,position:2,velocity:.6});session.finish(5000,200);
 const bank=renderVoiceBank(session.instrument),mix=mixImpulseRecording(session.snapshot(),bank);assert.equal(bank.length,9);assert.equal(mix.channels[0].length,5200);
 for(const i of [1,1300,1600,4000,5100])for(let c=0;c<2;c++){const sum=.5*bank[0].channels[c][i]+(i>=1400?.6*bank[8].channels[c][i-1400]:0),fade=i>=5000?(5200-i)/200:1;assert.ok(Math.abs(mix.channels[c][i]-sum*fade)<1e-8);}
});

test('shared-basis bank matches independently evaluated signed analytic modes',()=>{
 const session=createGroveVoiceSession({grove:composeGrove({seed:11}),voice:DEFAULT_VOICE_CONFIG},8000),{voice}=session.instrument,bank=renderVoiceBank(session.instrument);
 for(let p=0;p<3;p++)for(let body=0;body<3;body++)for(let channel=0;channel<2;channel++)for(const i of [1,19,307,2111,8001]){
  const t=i/8000,modes=voice.stereoModes[p][body][channel],expected=voice.outputGain*Math.min(1,(voice.ring-t)/voice.fade)*modes.reduce((sum,m)=>sum+m.amplitude*Math.exp(-t/m.decay)*Math.sin(2*Math.PI*m.frequency*t),0);
  assert.ok(Math.abs(bank[p*3+body].channels[channel][i]-expected)<1e-8);
 }
});
