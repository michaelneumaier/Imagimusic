import test from 'node:test';
import assert from 'node:assert/strict';
import {bindGroveMovieControls} from '../src/grove/movie-controls.js';

test('clearing a film invalidates its pending work without overwriting a newer render',async()=>{
 const previous=globalThis.document,elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{hidden:false,disabled:false,textContent:'',src:'old-film',paused:false,addEventListener(){},removeEventListener(){},pause(){this.paused=true;},removeAttribute(name){delete this[name];},load(){}});return elements.get(id);};
 globalThis.document={getElementById:element};
 const pending=[];
 try{
  const controls=bindGroveMovieControls({getSource:()=>({recording:{},camera:{},pcm:new Promise((resolve,reject)=>pending.push({resolve,reject}))})});
  controls.setReady(true);
  const first=element('movie').onclick();
  assert.equal(element('movie').disabled,true);
  controls.clear();
  assert.equal(element('movie-output').hidden,true);
  assert.equal(element('movie-preview').paused,true);
  assert.equal(element('movie-preview').src,undefined);
  assert.equal(element('movie-status').textContent,'');
  assert.equal(element('movie').disabled,false);
  const second=element('movie').onclick();
  pending[0].reject(new Error('old preparation failed'));
  await first;
  assert.equal(element('movie-status').textContent,'Preparing your film…');
  assert.equal(element('movie').disabled,true);
  assert.equal(element('movie-cancel').hidden,false);
  controls.clear();
  pending[1].reject(new Error('second preparation failed'));
  await second;
  assert.equal(element('movie-status').textContent,'');
  assert.equal(element('movie-cancel').hidden,true);
  controls.dispose();
 }finally{globalThis.document=previous;}
});
