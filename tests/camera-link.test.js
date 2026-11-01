import test from 'node:test';
import assert from 'node:assert/strict';
import {CAMERA_MODES,readCameraSearch,cameraURL} from '../src/stage/camera-link.js';
import {scoreURL} from '../src/stage/score-performance.js';
import {composeConversation} from '../src/score/conversation.js';
import {compositionURL,compositionPageURL} from '../src/stage/composition-link.js';
import {DEFAULT_COMPOSITION} from '../src/stage/composition.js';

test('camera mode survives score regeneration and round trips through instrument studies',()=>{
 for(const mode of CAMERA_MODES){
  const start=cameraURL('http://localhost/stage.html?instrument=lab#world',mode);
  const score=scoreURL(start,composeConversation({seed:732}));
  const composition=compositionURL(score,DEFAULT_COMPOSITION);
  const study=compositionPageURL(composition,'loom.html',DEFAULT_COMPOSITION);
  const returned=compositionPageURL(study,'stage.html',DEFAULT_COMPOSITION);
  for(const href of [start,score,composition,study,returned]){
   const url=new URL(href);assert.equal(readCameraSearch(url.search),mode);assert.equal(url.searchParams.get('instrument'),'lab');
  }
  assert.equal(new URL(score).hash,'#world');
 }
});

test('manual selection clears persistence and malformed modes are rejected',()=>{
 assert.equal(new URL(cameraURL('http://localhost/?camera=cinematic&loom=1','manual')).search,'?loom=1');
 assert.equal(readCameraSearch(''),'manual');
 for(const mode of ['',null,'spin','Cinematic'])assert.throws(()=>cameraURL('http://localhost/',mode));
 assert.throws(()=>readCameraSearch('?camera=spin'));
});
