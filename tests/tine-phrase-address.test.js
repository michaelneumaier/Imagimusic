import test from 'node:test';
import assert from 'node:assert/strict';
import {createTinePhraseRecord,tinePhraseFragment,readTineReturn} from '../src/tine/phrase-address.js';
import {createTineDesign,tineAddressFragment,requestForTineDesign} from '../src/tine/address.js';
import {prepareTineRequest} from '../src/tine/preparation.js';
const render=({design,timing})=>prepareTineRequest({kind:'body',...requestForTineDesign(design),timing});
test('body and committed rhythm round trip exactly including full audio; drafts cannot alter snapshots',()=>{
 const design={...createTineDesign({lengthMm:105,widthMm:7,activation:.3,pickup:.75})},timing={firstGapMs:2000,secondGapMs:200};
 const record=createTinePhraseRecord(design,timing),hash=tinePhraseFragment(record),before=render(record);
 design.lengthMm=60;timing.firstGapMs=200;
 const after=readTineReturn(hash);assert.equal(after.audition,'phrase');assert.equal(after.design.lengthMm,105);assert.equal(after.timing.firstGapMs,2000);
 assert.deepEqual(render(after),before);assert.ok(Object.isFrozen(after.design)&&Object.isFrozen(after.timing));
 assert.equal(tinePhraseFragment(createTinePhraseRecord(after.design,after.timing)),hash);
 const old=readTineReturn(tineAddressFragment(record.design));assert.equal(old.audition,'single');assert.deepEqual(old.timing,{firstGapMs:800,secondGapMs:1300});
 assert.equal(readTineReturn(''),null);assert.equal(readTineReturn('#'),null);
});
test('compound return refuses unknown fields, versions, malformed and off-grid timing rather than discarding the rhythm',()=>{
 const r=createTinePhraseRecord(createTineDesign(),{firstGapMs:800,secondGapMs:1300}),encode=x=>'#tine-phrase='+encodeURIComponent(JSON.stringify(x));
 for(const value of [null,[],{...r,version:2},{...r,extra:true},{...r,timing:null},{...r,timing:{firstGapMs:800}},{...r,timing:{...r.timing,extra:true}},{...r,timing:{...r.timing,firstGapMs:850}},{...r,design:{...r.design,extra:true}},{...r,kind:'unknown'}])assert.throws(()=>readTineReturn(encode(value)));
 for(const hash of ['#tine-phrase=%bad','#tine-phrase='+ 'x'.repeat(2048),'#unknown=1'])assert.throws(()=>readTineReturn(hash));
 assert.throws(()=>createTinePhraseRecord(r.design,undefined));
 for(const firstGapMs of [200,2000])for(const secondGapMs of [200,2000])assert.deepEqual(readTineReturn(tinePhraseFragment(createTinePhraseRecord(r.design,{firstGapMs,secondGapMs}))).timing,{firstGapMs,secondGapMs});
});
