import {createSpatialSketch} from '../src/sketch/spatial.js';
const parameters={frequencies:[200,201,320],decays:[2,.8,3],coefficients:[1,.2,.1,-.05,.7,.4]};
const spatial=createSpatialSketch(parameters),sampleRate=8000,seconds=4;
const positions=[['same-place',.25,.25],['other-side',.25,.75],['middle',.5,.5],['near-end',.05,.25],['endpoint',0,.25]];
const reference=spatial.render({sampleRate,seconds,activation:.25,pickup:.25}).channels[0];
const sumSquares=values=>values.reduce((s,x)=>s+x*x,0),referenceEnergy=sumSquares(reference);
const rows=positions.map(([id,activation,pickup])=>{
 const rendered=spatial.render({sampleRate,seconds,activation,pickup}),reversed=spatial.render({sampleRate,seconds,activation:pickup,pickup:activation});
 let peak=0,difference=0,maxReciprocityError=0;rendered.channels[0].forEach((x,i)=>{peak=Math.max(peak,Math.abs(x));difference+=(x-reference[i])**2;maxReciprocityError=Math.max(maxReciprocityError,Math.abs(x-reversed.channels[0][i]));});
 return {id,activation,pickup,weights:spatial.weights(activation,pickup),pickupGain:rendered.pickupGain,peak,rms:Math.sqrt(sumSquares(rendered.channels[0])/rendered.frames),relativeRmsFromReference:Math.sqrt(difference/referenceEnergy),maxReciprocityError,modalEnergyAtHalfSecond:spatial.modalState(.5,{activation}).reduce((sum,m)=>sum+m.energy,0)};
});
console.log(JSON.stringify({protocol:{parameters,sampleRate,seconds,shape:'phi_n(u) = sin((n+1)*pi*u), peak one, authored on a dimensionless interval',activation:'Weights both supplied displacement and velocity by phi at activation; not a point-force impulse.',pickup:'Signed displacement sum weighted by phi at pickup; no radiation, one source gain for every position.',fade:'Final 25 ms linear playback fade included in these sample metrics.',limits:'No inferred geometry, local material law, mass density, bridge, listening verdict or production page. Arbitrary modal frequencies do not make this a conventional string or beam.'},rows},null,2));
