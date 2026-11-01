import test from 'node:test';
import assert from 'node:assert/strict';
import {createPoweredGesture} from '../src/grove/powered-gesture.js';
const harness=()=>{const commands=[];return {commands,gesture:createPoweredGesture({send:event=>commands.push(event)})};};
test('overlapping keyboard and pointer holds restore only still-held contacts',()=>{
 const {commands,gesture:g}=harness();g.hold('key-upper',0);g.hold('pointer-7',1);g.release('key-upper');assert.equal(g.zone,1);g.release('pointer-7');
 assert.deepEqual(commands.map(c=>c.zone),[0,1,null]);assert.equal(g.count,0);
 g.hold('key-upper',0);g.hold('pointer-7',1);g.release('pointer-7');assert.equal(g.zone,0);g.release('key-upper');assert.deepEqual(commands.slice(3).map(c=>c.zone),[0,1,0,null]);
});
test('pointer movement changes contact without emitting begin or repeated commands',()=>{
 const {commands,gesture:g}=harness();g.hold('pointer-1',0);g.hold('pointer-1',1);g.hold('pointer-1',1);g.release('pointer-1');g.release('pointer-1');
 assert.deepEqual(commands,[{kind:'contact',zone:0},{kind:'contact',zone:1},{kind:'contact',zone:null}]);
});
test('key repeat cannot steal the contact from a later pointer, and same-zone release remains held',()=>{
 const {commands,gesture:g}=harness();g.hold('key',0);g.hold('pointer',1);g.hold('key',0);assert.equal(g.zone,1);assert.equal(commands.length,2);
 g.hold('other-pointer',1);g.release('pointer');assert.equal(g.zone,1);assert.equal(commands.length,2);g.reset();g.reset();assert.deepEqual(commands.map(c=>c.zone),[0,1,null]);
});
test('rejected contact changes preserve held ownership, including a rejected reset',()=>{
 let accepting=true;const g=createPoweredGesture({send:()=>accepting});g.hold('key',0);accepting=false;
 assert.equal(g.hold('pointer',1).accepted,false);assert.equal(g.zone,0);assert.equal(g.count,1);assert.equal(g.reset().accepted,false);assert.equal(g.count,1);
 accepting=true;g.release('key');assert.equal(g.zone,null);assert.equal(g.count,0);
});
test('terminal clearing never sends a command, and malformed holds do not mutate ownership',()=>{
 const {commands,gesture:g}=harness();g.hold('key',0);assert.throws(()=>g.hold('',1),/identity/);assert.throws(()=>g.hold('pointer',2),/zone/);assert.equal(g.zone,0);
 g.clear();assert.equal(g.count,0);assert.equal(g.zone,null);assert.equal(commands.length,1);
});
