import test from 'node:test';
import assert from 'node:assert/strict';
import {readCompositionSearch,compositionURL} from '../src/stage/composition-link.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';
test('creative Loom settings round-trip in a link and preserve independent instrument parameters',()=>{
 const composition={version:1,loom:{enabled:true,settings:{frequency:220,coupling:.02,detune:-33,loss:.8}}};
 const url=new URL(compositionURL('http://localhost/stage.html?instrument=lab#stage',composition));
 assert.deepEqual(readCompositionSearch(url.search),composition);
 assert.equal(url.searchParams.get('instrument'),'lab');assert.equal(url.hash,'#stage');
 composition.loom.enabled=false;
 const disabled=new URL(compositionURL(url,composition));
 assert.equal(disabled.searchParams.has('loom'),false);
 assert.deepEqual(readCompositionSearch(disabled.search),composition);
 assert.deepEqual(readCompositionSearch(''),DEFAULT_COMPOSITION);
 assert.equal(readCompositionSearch('?loom=1').loom.enabled,true);
});
test('invalid link settings fail explicitly instead of silently changing the sound',()=>{
 for(const value of ['{','null','{"frequency":-1}','{"coupling":0.5}'])assert.throws(()=>readCompositionSearch('?loom=1&loomSettings='+encodeURIComponent(value)));
});

test('FM links preserve complete sound settings and independent enable flags with Loom',async()=>{
 const {DEFAULT_TENSIONER}=await import('../src/fm.js');
 const composition={version:2,loom:{...DEFAULT_COMPOSITION.loom,enabled:true},fm:{enabled:true,settings:{...DEFAULT_TENSIONER,ratio:.01,phase0:.7,level:.12}}};
 const url=new URL(compositionURL('http://localhost/stage.html?instrument=lab#stage',composition));
 assert.deepEqual(readCompositionSearch(url.search),composition);
 assert.equal(url.searchParams.get('instrument'),'lab');assert.equal(url.hash,'#stage');
 composition.fm.enabled=false;
 assert.deepEqual(readCompositionSearch(new URL(compositionURL(url,composition)).search),composition);
 const old=new URL(compositionURL(url,DEFAULT_COMPOSITION));assert.deepEqual(readCompositionSearch(old.search),DEFAULT_COMPOSITION);
 assert.equal(readCompositionSearch('?fmEnabled=1').fm.enabled,true);
 assert.throws(()=>readCompositionSearch('?fmEnabled=1&fm=oops'));
});

test('stage to either study and back retains the session-backed laboratory instrument',async()=>{
 const {compositionPageURL}=await import('../src/stage/composition-link.js');
 const {DEFAULT_TENSIONER}=await import('../src/fm.js');
 const saved={...structuredClone(DEFAULT_COMPOSITION),version:2,fm:{enabled:true,settings:{...DEFAULT_TENSIONER,ratio:.01}}};
 for(const page of ['loom.html','tensioner.html']){
  const study=new URL(compositionPageURL('http://localhost/stage.html?instrument=lab',page,saved));
  assert.equal(study.pathname,'/'+page);assert.equal(study.searchParams.get('instrument'),'lab');
  const returned=new URL(compositionPageURL(study,'stage.html',saved));
  assert.equal(returned.searchParams.get('instrument'),'lab');assert.deepEqual(readCompositionSearch(returned.search),saved);
 }
 const ordinary=new URL(compositionPageURL('http://localhost/stage.html?instrument=unknown','loom.html',saved));
 assert.equal(ordinary.searchParams.has('instrument'),false);
});
