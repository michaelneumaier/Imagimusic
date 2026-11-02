import test from 'node:test';import assert from 'node:assert/strict';
import {historyPoint,historyPath} from '../src/touch/history-layout.js';
test('time circles keep a shared clockwise time axis independent of body and envelope',()=>{
 const options={layout:'circles',duration:4,ceiling:.5};
 for(const body of [0,1])for(const envelope of [0,.25,.5,1]){
  const radius=100+150*body+70*Math.min(1,envelope/.5);
  for(const [time,dx,dy] of [[0,0,-1],[1,1,0],[2,0,1],[3,-1,0],[4,0,-1]]){
   const [x,y]=historyPoint(body,time,envelope,options);assert.ok(Math.abs(x-(600+radius*dx))<1e-10);assert.ok(Math.abs(y-(355+radius*dy))<1e-10);
  }
 }
 assert.throws(()=>historyPoint(0,5,0,options),/Invalid/);assert.throws(()=>historyPoint(0,1,NaN,options),/Invalid/);
});
test('both drawings retain strike breaks, clipping identity and immutable samples',()=>{
 const history={points:[{time:0,side:'at',envelope:[.1,.2]},{time:1,side:'before',envelope:[.05,.1]},{time:1,side:'at',envelope:[.8,.4]},{time:2,side:'at',envelope:[0,0]}]},before=structuredClone(history);
 for(const layout of ['strips','circles']){const result=historyPath(history,0,{layout,duration:2,ceiling:.5});assert.equal((result.path.match(/M/g)||[]).length,2);assert.equal((result.path.match(/L/g)||[]).length,2);assert.equal(result.clipped.length,1);assert.ok(!result.path.includes('Z'));}
 assert.deepEqual(history,before);
});
