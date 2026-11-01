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
