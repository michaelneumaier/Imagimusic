import test from 'node:test';
import assert from 'node:assert/strict';
import {createTineTiming,tineTimingPhrase} from '../src/tine/timing.js';
import {prepareTineRequest,tineTransferBuffers} from '../src/tine/preparation.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {renderTinePhrase,TINE_PHRASE} from '../src/tine/phrase.js';
const body=requestForTineDesign(createTineDesign());
test('timing grid keeps strength, order, impulse budget and four-second tail across all 361 choices',()=>{
 assert.deepEqual(tineTimingPhrase().events,TINE_PHRASE);
 for(let a=200;a<=2000;a+=100)for(let b=200;b<=2000;b+=100){
  const p=tineTimingPhrase(createTineTiming({firstGapMs:a,secondGapMs:b}));
  assert.deepEqual(p.events.map(e=>e.strength),[.25,.15,.25]);
  assert.deepEqual(p.events.map(e=>e.time),[0,a/1000,(a+b)/1000]);
  assert.equal(p.seconds,(a+b+4000)/1000);assert.ok(p.seconds<=8);
 }
 for(const firstGapMs of [0,199,250,2001,NaN,'800'])assert.throws(()=>createTineTiming({firstGapMs}));
 for(const bad of [null,[],{}, {firstGapMs:800,secondGapMs:1300,extra:1}])assert.throws(()=>tineTimingPhrase(bad));
});
test('comparison preparation changes both phrases together, preserves width scaling and transfers every output buffer',()=>{
 const timing={firstGapMs:200,secondGapMs:200},wide=requestForTineDesign(createTineDesign({widthMm:20}));
 const pair=prepareTineRequest({kind:'phrase-pair',bodies:[body,wide],timing});
 assert.equal(pair.phrases.length,2);assert.equal(pair.phrases[0].seconds,4.4);
 const expected=renderTinePhrase(body.geometry,{...body.options,...tineTimingPhrase(timing)});
 assert.deepEqual(pair.phrases[0].channels,expected.channels);
 for(let i=0;i<expected.frames;i++)assert.equal(pair.phrases[1].channels[0][i],expected.channels[0][i]/2);
 timing.firstGapMs=2000;assert.equal(pair.timing.firstGapMs,200);
 assert.deepEqual(tineTransferBuffers(pair),pair.phrases.map(p=>p.channels[0].buffer));
 const bundle=prepareTineRequest({kind:'body',...body});assert.deepEqual(bundle.phrase.channels,renderTinePhrase(body.geometry).channels);
 assert.equal(tineTransferBuffers(bundle).length,2);
 const before=pair.phrases[0].channels[0].slice();
 assert.throws(()=>prepareTineRequest({kind:'phrase-pair',bodies:[body,{...wide,options:{sampleRate:8000}}],timing:createTineTiming()}),/retained mode/);
 assert.deepEqual(pair.phrases[0].channels[0],before);
 assert.throws(()=>prepareTineRequest({kind:'phrase-pair',bodies:[]}));
 assert.throws(()=>prepareTineRequest({kind:'unknown',...body}));
});
