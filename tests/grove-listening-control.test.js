import test from 'node:test';
import assert from 'node:assert/strict';
import {bindListeningControl} from '../src/grove/listening-control.js';
function setup(storage){
 const input=new EventTarget(),output={},levels=[[],[]];
 const binding=bindListeningControl({input,output,targets:levels.map(values=>({setListeningDb:db=>values.push(db)})),defaultDb:18,storageKey:'level',storage});
 return {input,output,levels,binding};
}
test('one saved preference applies equally to live and replay; changes persist only as a level',()=>{
 const data=new Map([['level','12']]),f=setup({getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)});
 assert.deepEqual(f.levels,[[12],[12]]);assert.equal(f.output.textContent,'+12 dB');
 f.input.value='6';f.input.dispatchEvent(new Event('input'));assert.deepEqual(f.levels,[[12,6],[12,6]]);assert.equal(data.get('level'),'6');
 f.binding.dispose();f.input.value='3';f.input.dispatchEvent(new Event('input'));assert.equal(f.levels[0].length,2);
});
test('unavailable or corrupt preferences leave a usable declared default',()=>{
 for(const raw of ['Infinity','-1','21','not a number','',null]){
  const f=setup({getItem:()=>raw,setItem(){throw new Error('disabled');}});assert.deepEqual(f.levels,[[18],[18]]);
  f.input.value='0';assert.doesNotThrow(()=>f.input.dispatchEvent(new Event('input')));assert.deepEqual(f.levels,[[18,0],[18,0]]);
 }
 const f=setup({getItem(){throw new Error('unavailable');}});assert.equal(f.output.textContent,'+18 dB');
});
