import test from 'node:test';
import assert from 'node:assert/strict';
import {createClipPerformance,clipExpressionFrame,renderClipAudio} from '../src/expressive/clip-performance.js';
import {createExpressionPerformance} from '../src/expressive/performance.js';
import {composeExpressiveStudy} from '../src/midi2/expression.js';
const hex=s=>Uint8Array.from(s.replaceAll(/\s/g,'').match(/../g),h=>parseInt(h,16));
// TPQ3,120BPM: one setup tick is1/6s, not sample-aligned at8kHz.
const bytes=hex('534d4632434c4950 00400000 00300003 40e00000 ffffffff 00400001 f0200000 00000000 00000000 00000000 40903c00 80000000 00400003 40803c00 00000000 00400030 f0210000 00000000 00000000 00000000');
test('Clip window preserves ending silence and uses one declared sample origin for audio and picture',async()=>{
 const clip=createClipPerformance(bytes,{sampleRate:8000});
 assert.equal(clip.originFrame,1334);assert.equal(clip.playbackOriginSeconds,1334/8000);
 assert.ok(clip.originRoundingSeconds>=0&&clip.originRoundingSeconds<1/8000);
 assert.equal(clip.performance.duration,clip.imported.end.seconds+.25);
 assert.equal(clip.performance.score.events.length,3,'no fake end event');
 const picture=clipExpressionFrame(clip,0);assert.equal(picture.time,1334/8000);
 assert.equal(picture.voices[0].pitchHcu,60+2*(1-Math.exp(-(1334/8000)/.005)),'setup smoothing uses the cropped source time');
 const full=new Float32Array(clip.sourceFrames);full[1333]=.7;full[1334]=.2;full[full.length-1]=.1;
 let received;
 const result=await renderClipAudio(clip,{render:async p=>{received=p;return {sampleRate:8000,channels:[full]};}});
 assert.equal(received,clip.performance);assert.equal(result.channels[0].length,clip.playbackFrames);
 assert.equal(result.channels[0][0],full[1334]);assert.equal(result.channels[0].at(-1),full.at(-1));
 result.channels[0][0]=0;assert.notEqual(full[1334],0,'cropped result owns its samples');
 assert.throws(()=>clipExpressionFrame(clip,-1),/outside/);
});
test('render shape mismatch refuses a mislabeled crop and performance ending cannot truncate events',async()=>{
 const clip=createClipPerformance(bytes,{sampleRate:8000});
 await assert.rejects(()=>renderClipAudio(clip,{render:async()=>({sampleRate:8000,channels:[new Float32Array(1)]})}),/sample window/);
 const study=composeExpressiveStudy(),original=createExpressionPerformance(study);
 assert.equal(createExpressionPerformance(study,undefined,48000,{}).duration,original.duration);
 assert.throws(()=>createExpressionPerformance(study,undefined,48000,{endSeconds:1}),/include every event/);
 assert.throws(()=>createExpressionPerformance(study,undefined,48000,{endSeconds:31}),/30 seconds/);
 assert.throws(()=>createExpressionPerformance(study,undefined,48000,{endSeconds:Infinity}),/30 seconds/);
});
