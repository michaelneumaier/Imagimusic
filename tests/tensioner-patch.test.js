import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_TENSIONER,tensionerCore,renderTensioner} from '../src/fm.js';
import {createTensionerPatch,parseTensionerPatch,readTensionerSearch,tensionerURL} from '../src/tensioner/patch.js';
test('saved FM settings and links reproduce the same waveform including non-slider fields',()=>{
 const settings={...DEFAULT_TENSIONER,carrierHz:339.125,ratio:1.2345,index:2.37,constantIndex:true,level:.12,phase0:.7,ampDecayS:.1};
 const saved=createTensionerPatch(settings),loaded=parseTensionerPatch(JSON.stringify(saved));
 assert.deepEqual(loaded.settings,settings);assert.equal('derived' in saved.settings,false);
 const url=new URL(tensionerURL('http://localhost/tensioner.html?view=wide#study',settings));
 assert.deepEqual(readTensionerSearch(url.search),saved);assert.equal(url.searchParams.get('view'),'wide');assert.equal(url.hash,'#study');
 assert.deepEqual(renderTensioner(tensionerCore(settings)),renderTensioner(tensionerCore(loaded.settings)));
 assert.deepEqual(readTensionerSearch(''),createTensionerPatch());
});
test('malformed, partial, noncanonical or out-of-range settings fail before use',()=>{
 const record=createTensionerPatch();
 for(const value of ['{',null,{}, {...record,version:2},{...record,extra:true},{version:1,settings:[]},{version:1,settings:{...record.settings,index:100}},{version:1,settings:{...record.settings,constantIndex:'false'}}])assert.throws(()=>parseTensionerPatch(value));
 const partial=structuredClone(record);delete partial.settings.phase0;assert.throws(()=>parseTensionerPatch(partial));
});
