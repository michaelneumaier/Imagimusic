import test from 'node:test';
import assert from 'node:assert/strict';
import {listeningGain,listeningCeilingCurve,createListeningLevel,LISTENING_CEILING} from '../src/grove/listening-level.js';
test('declared listening gain and ceiling preserve low samples and bound extreme ones',()=>{
 assert.equal(listeningGain(0),1);assert.equal(listeningGain(20),10);
 for(const bad of [-1,21,NaN,Infinity,'20'])assert.throws(()=>listeningGain(bad));
 const curve=listeningCeilingCurve();assert.equal(curve[4096],0);
 for(let i=0;i<curve.length;i++){const x=2*i/(curve.length-1)-1;assert.ok(Math.abs(curve[i])<=LISTENING_CEILING+1e-7);if(Math.abs(x)<.94)assert.equal(curve[i],x);if(i)assert.ok(curve[i]>=curve[i-1]);}
});
test('changing listening level ramps downstream gain and disposes without touching a source',()=>{
 const calls=[],gain={gain:{value:0,cancelAndHoldAtTime:t=>calls.push(['hold',t]),linearRampToValueAtTime:(v,t)=>calls.push(['ramp',v,t])},connect:n=>calls.push(['connect',n]),disconnect:()=>calls.push(['gain-disconnect'])},ceiling={disconnect:()=>calls.push(['ceiling-disconnect'])};
 const context={currentTime:2,createGain:()=>gain,createWaveShaper:()=>ceiling};
 const stage=createListeningLevel(context);assert.equal(stage.input,gain);assert.equal(stage.output,ceiling);assert.equal(gain.gain.value,1);stage.setDb(20);assert.equal(stage.db,20);assert.deepEqual(calls.slice(-2),[['hold',2],['ramp',10,2.03]]);
 assert.throws(()=>stage.setDb(25));stage.dispose();stage.dispose();assert.equal(calls.filter(c=>c[0]==='gain-disconnect').length,1);assert.throws(()=>stage.setDb(1),/closed/);
});
