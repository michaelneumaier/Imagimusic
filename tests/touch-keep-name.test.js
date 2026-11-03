import test from 'node:test';
import assert from 'node:assert/strict';
import {touchKeepNames} from '../src/touch/keep-name.js';
test('optional passage names pair sound and gestures while preserving recognizable Unicode',()=>{
 assert.deepEqual(touchKeepNames(),{sound:'imagimusic-touch.wav',gestures:'imagimusic-touch.json'});
 const names=touchKeepNames('  Cafe\u0301 after rain 🌙  ');
 assert.equal(names.sound,'imagimusic-touch-Café after rain 🌙.wav');
 assert.equal(names.gestures,names.sound.replace(/\.wav$/,'.json'));
});
test('download labels stay bounded single filenames with their declared extensions',()=>{
 for(const name of ['../CON/aux\\file.json','a\u0000b\u202ec','<>:"|?*','🌙'.repeat(80)]){
  const names=touchKeepNames(name);
  for(const value of Object.values(names)){
   assert.ok(!/[<>:"/\\|?*\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value));
   assert.ok(Buffer.byteLength(value,'utf8')<255);
   assert.ok(value.startsWith('imagimusic-touch'));
  }
  assert.ok(names.sound.endsWith('.wav'));assert.ok(names.gestures.endsWith('.json'));
 }
 assert.deepEqual(touchKeepNames(' ... '),touchKeepNames());
});
