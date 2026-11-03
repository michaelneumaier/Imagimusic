import test from 'node:test';import assert from 'node:assert/strict';
import {createLivingResponse} from '../src/living/response.js';
import {createTineLiveResponse} from '../src/tine/live-response.js';
import {createTineDesign,requestForTineDesign} from '../src/tine/address.js';
import {createTineImpulse} from '../src/tine/impulse.js';
const design=createTineDesign();
test('veil encloses actual displacement and matches modal quadratures across impulse boundaries',()=>{
 for(const sampleRate of [44100,48000,96000]){
  const events=[{frame:137,strength:.1},{frame:9013,strength:-.05},{frame:9013,strength:.1}],view=createLivingResponse(design,sampleRate);
  events.forEach(e=>view.accept(e));
  const exact=createTineLiveResponse({kind:'imagimusic-tine-live',version:1,design,sampleRate,events,fadeStart:50003});
  const model=createTineImpulse(requestForTineDesign(design).geometry);
  for(const frame of [0,136,137,138,9012,9013,9014,30001,50003]){
   const response=view.at(frame/sampleRate),state=exact.at(frame);
   state.modes.forEach((m,i)=>{const mode=model.modes[i],expected=Math.hypot(m.displacementM,(m.velocityMPerS+mode.gamma*m.displacementM)/mode.omegaD);assert.ok(Math.abs(response.amplitudesM[i]-expected)<1e-18);});
   state.points.forEach((p,i)=>assert.ok(Math.abs(p.displacementM)<=response.points[i].boundM+1e-18));
   assert.equal(response.points[0].boundM,0);
  }
 }
});
test('envelope preserves signed cancellation and exact free decay without display-rate phase aliasing',()=>{
 const view=createLivingResponse(design,48000),model=createTineImpulse(requestForTineDesign(design).geometry);
 view.accept({frame:0,strength:.1});const a=view.at(.1),b=view.at(.7);
 a.amplitudesM.forEach((v,i)=>assert.ok(Math.abs(b.amplitudesM[i]-v*Math.exp(-model.modes[i].gamma*.6))<1e-20));
 view.accept({frame:0,strength:-.1});assert.ok(view.at(.7).points.every(p=>p.boundM===0));
 assert.throws(()=>view.accept({frame:-1,strength:.1}));assert.throws(()=>view.accept({frame:192001,strength:.1}));assert.throws(()=>view.at(NaN));
});

test('completed-record boundary at four seconds is accepted without anticipating the touch',()=>{
 const view=createLivingResponse(design,48000);view.accept({frame:192000,strength:.1});
 assert.ok(view.at(4-1/48000).points.every(p=>p.boundM===0));
 assert.ok(view.at(4).points.some(p=>p.boundM>0));
});
