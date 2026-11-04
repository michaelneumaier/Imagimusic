import test from 'node:test';
import assert from 'node:assert/strict';
import {setupLivingTuningListening} from '../src/living/tuning-listening.js';

test('comparison switches cancel late playback, native replay coordinates, and leaving parks',async()=>{
 const elements=new Map();
 const make=()=>({handlers:{},hidden:false,textContent:'',addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);},async fire(type){await Promise.all((this.handlers[type]??[]).map(fn=>fn()));},removeAttribute(){},load(){}});
 const document=make(),window=make();document.getElementById=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id);};
 const oldDocument=globalThis.document,oldWindow=globalThis.window;
 globalThis.document=document;globalThis.window=window;
 let resolvePlay,stops=0,parks=0,coordinations=0,level;
 const player={play:()=>new Promise(resolve=>resolvePlay=resolve),stop:()=>stops++,park:()=>parks++,resume:async()=>{},setDb:value=>level=value};
 try{
  document.getElementById('tuning-seed').value='42';document.getElementById('tuning-family').value='existing';
  const controls=setupLivingTuningListening({beforePlay:()=>coordinations++,createPlayer:()=>player});
  assert.match(elements.get('tuning-download').href,/42-existing.wav$/);
  const pending=elements.get('tuning-listen').fire('click');
  assert.equal(coordinations,1);
  elements.get('tuning-family').value='fifths';await elements.get('tuning-family').fire('change');
  resolvePlay(true);await pending;
  assert.equal(elements.get('tuning-audio').hidden,true);
  assert.match(elements.get('tuning-status').textContent,/Ready/);
  assert.match(elements.get('tuning-download').href,/42-fifths.wav$/);
  const next=elements.get('tuning-listen').fire('click');resolvePlay(true);await next;
  assert.equal(elements.get('tuning-audio').hidden,false);
  await elements.get('tuning-audio').fire('play');assert.equal(coordinations,3);
  controls.setDb(6);assert.equal(level,6);
  controls.stop();assert.ok(stops>=4);
  document.hidden=true;await document.fire('visibilitychange');await window.fire('pagehide');assert.equal(parks,2);
 }finally{globalThis.document=oldDocument;globalThis.window=oldWindow;}
});
