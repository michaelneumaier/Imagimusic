import test from 'node:test';import assert from 'node:assert/strict';
import {renderLivingSpace,LIVING_SPACES} from '../src/living/space-study.js';
const source=()=>({sampleRate:8000,channels:[new Float32Array(800),new Float32Array(800)]});
test('dry treatment preserves exact source and all treatments share a silent-ended two-second tail without mutating input',()=>{
 const pcm=source();pcm.channels[0][3]=.1;pcm.channels[1][100]=-.2;const before=structuredClone(pcm);
 for(const {id}of LIVING_SPACES){const out=renderLivingSpace(pcm,id);assert.equal(out.frames,16800);assert.ok(out.peak<=1);for(const c of out.channels)assert.equal(c.at(-1),0);}
 const dry=renderLivingSpace(pcm,'dry');for(let ch=0;ch<2;ch++){assert.deepEqual(dry.channels[ch].slice(0,800),pcm.channels[ch]);assert.ok(dry.channels[ch].slice(800).every(v=>v===0));}assert.deepEqual(pcm,before);
});
test('close first reflection matches independently evaluated one-pole impulse, and cross reflection arrives on the opposite channel',()=>{
 const pcm=source();pcm.channels[0][0]=.1;const out=renderLivingSpace(pcm,'close'),alpha=1-Math.exp(-2*Math.PI*6000/8000),start=Math.round(.017*8000),cross=Math.round(.029*8000);
 assert.equal(out.channels[0][0],pcm.channels[0][0]);assert.ok(out.channels[0].slice(1,start).every(v=>v===0));assert.ok(out.channels[1].slice(0,cross).every(v=>v===0));
 for(let i=0;i<4;i++)assert.ok(Math.abs(out.channels[0][start+i]-.12*pcm.channels[0][0]*alpha*(1-alpha)**i)<1e-9);
 assert.ok(Math.abs(out.channels[1][cross]-.09*pcm.channels[0][0]*alpha)<1e-9);
});
test('study refuses invalid source or unknown treatment without changing source',()=>{
 assert.throws(()=>renderLivingSpace(source(),'hall'));const p=source();p.channels[0][0]=NaN;assert.throws(()=>renderLivingSpace(p,'dry'));assert.throws(()=>renderLivingSpace({...source(),sampleRate:0},'wide'));
});
