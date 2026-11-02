import test from 'node:test';
import assert from 'node:assert/strict';
import {touchConnectionHref,readTouchConnection} from '../src/touch/connection-link.js';
import {LOOM_JOURNEYS} from '../src/listen/journeys.js';
import {createTouchSession} from '../src/touch/session.js';
test('connection links preserve presets and exact custom settings without carrying gestures',()=>{
 for(const preset of LOOM_JOURNEYS){const href=touchConnectionHref(preset.settings);assert.equal(href,`touch.html?bridge=${preset.id}`);assert.deepEqual(readTouchConnection(href.split('?')[1]).settings,preset.settings);}
 for(const settings of [{frequency:233.08188075904496,coupling:.007,detune:-37.25,loss:.61},{frequency:80,coupling:0,detune:-120,loss:.2},{frequency:600,coupling:.04,detune:120,loss:2}]){
  const before=structuredClone(settings),href=touchConnectionHref(settings),route=readTouchConnection(href.split('?')[1]);
  assert.equal(route.custom,true);assert.deepEqual(route.settings,before);assert.deepEqual(settings,before);
  const session=createTouchSession(route.settings,44100);assert.deepEqual(session.snapshot().settings,before);assert.deepEqual(session.snapshot().events,[]);assert.equal(session.snapshot().ended,null);
 }
});
test('malformed, ambiguous or unsupported connection routes are refused',()=>{
 for(const settings of [{frequency:700,coupling:0,detune:0,loss:.5},{frequency:196,coupling:0,detune:0},{frequency:196,coupling:0,detune:0,loss:.5,extra:1},{frequency:'196',coupling:0,detune:0,loss:.5},null,[]])assert.throws(()=>readTouchConnection(new URLSearchParams({connection:JSON.stringify(settings)})));
 for(const search of ['connection={','connection='+encodeURIComponent(' '.repeat(257)),'bridge=missing','bridge=close-kin&bridge=tight-weave','connection={}&connection={}','connection={}&bridge=close-kin'])assert.throws(()=>readTouchConnection(search));
 assert.equal(readTouchConnection('').id,'close-kin');
 assert.throws(()=>touchConnectionHref({frequency:NaN,coupling:0,detune:0,loss:.5}));
});
