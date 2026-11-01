import test from 'node:test';
import assert from 'node:assert/strict';
import {modalSnapshot,bellowsSnapshot} from '../src/snapshots.js';
import {DEFAULT_PATCH,modesForVoice,tineModes,envelope} from '../src/model.js';
import {collectState} from '../src/state.js';
import {drawGarden,drawTine} from '../src/scene.js';
import {drawBellows} from '../src/bellows-scene.js';
function canvasStub(){return new Proxy({}, {get(target,key){if(key in target)return target[key];if(String(key).startsWith('create'))return ()=>({addColorStop(){}});return (...args)=>{assert.ok(args.every(value=>typeof value!=='number'||Number.isFinite(value)),key+' received a nonfinite coordinate');};},set(target,key,value){target[key]=value;return true;}});}
test('live snapshots omit graph objects and geometry functions and retain note-local settings',()=>{
 const graph={};graph.self=graph;
 const voice={id:7,index:8,time:2,end:8,velocity:.7,position:.4,approach:.18,modes:modesForVoice(8,DEFAULT_PATCH),nodes:[graph],gain:graph};
 const snap=modalSnapshot(voice);assert.doesNotThrow(()=>JSON.stringify(snap));assert.ok(!('nodes'in snap));assert.ok(snap.modes.every(m=>!('shape'in m)));
 const breath={id:2,slot:1,noteHz:220,velocity:.7,noteOn:1,noteOff:2,patch:structuredClone(DEFAULT_PATCH),graph,stolenAt:1.5,stolenAmp:.3,stolenEnv:.4};
 const copied=bellowsSnapshot(breath);breath.patch.bellows.source='air';assert.equal(copied.bellows.source,'saw');assert.equal(copied.stolenAmp,.3);assert.doesNotThrow(()=>JSON.stringify(copied));
});
test('all laboratory canvases draw from serialized StateFrames with matching modal energies',()=>{
 const modes=modesForVoice(0,DEFAULT_PATCH),voice={id:1,index:0,time:1,end:8,velocity:.7,position:.37,approach:.18,modes};
 const snapshots={garden:{voices:[modalSnapshot(voice)]},tine:{voices:[modalSnapshot({...voice,index:8,modes:tineModes(DEFAULT_PATCH)})]},bellows:{voices:[bellowsSnapshot({id:2,slot:0,noteHz:220,velocity:.7,noteOn:1,noteOff:2,patch:DEFAULT_PATCH})]}};
 for(const time of [.9,1,1.1,2.1,9]){
  const frame=JSON.parse(JSON.stringify(collectState(time,snapshots))),ctx=canvasStub();
  const garden=drawGarden(ctx,1000,430,{frame,patch:DEFAULT_PATCH});
  drawTine(ctx,1000,290,{frame,patch:DEFAULT_PATCH,modes:tineModes(DEFAULT_PATCH)});
  const choir=drawBellows(ctx,1000,360,{frame,patch:DEFAULT_PATCH});assert.equal(choir.length,6);
  if(time===1.1){const expected=Math.min(1.6,modes.reduce((sum,m)=>sum+envelope(time-1,m.decay)*m.amplitude,0)*.7*3);assert.ok(Math.abs(garden.energies[0]-expected)<1e-12);}
 }
});
