import test from 'node:test';
import assert from 'node:assert/strict';
import {tineDisplacementWindow} from '../src/tine/displacement-window.js';
import {createTineImpulse} from '../src/tine/impulse.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
const geometry=requestForTineDesign(createTineDesign()).geometry;
const close=(a,b,tol=1e-18)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
test('window projection agrees with direct spatial population statistics, including returning excitation',()=>{
 const model=createTineImpulse(geometry),strike=model.strike({impulseNs:1e-7}),count=480,samples=new Float64Array(count*4);
 for(let n=0;n<count;n++){
  const a=strike.modalState(n/48000),b=strike.modalState((n-137)/48000);
  for(let i=0;i<4;i++)samples[n*4+i]=a[i].displacementM-.5*b[i].displacementM;
 }
 const before=samples.slice(),result=tineDisplacementWindow(geometry,{samples,sampleRate:48000,startFrame:31});
 assert.equal(result.lastSampleFrame,510);assert.equal(result.endFrameExclusive,511);
 for(const p of result.points){
  const values=Array.from({length:count},(_,n)=>model.modes.reduce((s,m,i)=>s+m.shape(p.u)*samples[n*4+i],0));
  const mean=values.reduce((a,b)=>a+b,0)/count,variance=values.reduce((s,x)=>s+(x-mean)**2,0)/count;
  close(p.meanM,mean);close(p.standardDeviationM,Math.sqrt(variance));close(p.rmsM,Math.sqrt(values.reduce((s,x)=>s+x*x,0)/count));
 }
 assert.deepEqual(samples,before);
 const half=tineDisplacementWindow({...geometry,widthM:geometry.widthM*2},{samples:samples.map(x=>x/2),sampleRate:48000});
 for(let i=0;i<81;i++){close(half.points[i].meanM,result.points[i].meanM/2);close(half.points[i].rmsM,result.points[i].rmsM/2);}
 samples.fill(0);assert.ok(result.points[80].rmsM>0);
});
test('cross terms preserve correlated cancellation; one sample has zero spread',()=>{
 const model=createTineImpulse(geometry),u=.5,ratio=model.modes[0].shape(u)/model.modes[1].shape(u),samples=new Float64Array(400);
 for(let n=0;n<100;n++){const q=(n-50)*1e-9;samples[n*4]=q;samples[n*4+1]=-ratio*q;}
 const result=tineDisplacementWindow(geometry,{samples,sampleRate:48000}),p=result.points[40];
 assert.ok(p.standardDeviationM<1e-14);close(p.meanM,0);
 const diagonal=model.modes.reduce((s,m,i)=>s+m.shape(u)**2*result.covarianceModalM2[i*4+i],0);
 assert.ok(Math.sqrt(diagonal)>1e-9,'dropping cross terms would invent visible spread');
 const one=tineDisplacementWindow(geometry,{samples:new Float64Array([1e-7,-2e-8,3e-9,0]),sampleRate:48000});
 assert.ok(one.points.every(p=>p.standardDeviationM===0&&p.rmsM===Math.abs(p.meanM)));
 assert.equal(one.points[0].rmsM,0);
});
test('malformed, nonfinite and out-of-study samples are refused',()=>{
 const valid={samples:new Float64Array(4),sampleRate:48000};
 for(const samples of [[],new Float32Array(4),new Float64Array(0),new Float64Array(5),new Float64Array(384004),new Float64Array([NaN,0,0,0]),new Float64Array([Infinity,0,0,0]),new Float64Array([.01,0,0,0])])assert.throws(()=>tineDisplacementWindow(geometry,{...valid,samples}));
 for(const sampleRate of [7999,96001,48000.5,NaN])assert.throws(()=>tineDisplacementWindow(geometry,{...valid,sampleRate}));
 for(const startFrame of [-1,.5,Number.MAX_SAFE_INTEGER])assert.throws(()=>tineDisplacementWindow(geometry,{...valid,startFrame}));
});
