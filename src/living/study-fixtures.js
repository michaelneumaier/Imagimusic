import {createLivingDirectedPhrase} from './generative-phrase.js';
import {createLivingGreeting} from './greeting.js';
/** Authored controls shared by the sound and visual workshops, never visitor capture. */
export function createLivingStudyFixtures(){
 const greeting=createLivingGreeting();
 const fixture=(times,strengths)=>({...greeting,events:times.map((t,i)=>({frame:Math.round(t*greeting.sampleRate),strength:strengths[i]}))});
 return [{id:'greeting',name:'Three touches',source:greeting},
  {id:'single',name:'One touch',source:fixture([.5],[.1])},
  {id:'crowded',name:'Eight nearby touches',source:fixture([.5,.525,.55,.575,.6,.625,.65,.675],[.05,.025,.025,.025,.025,.025,.025,.05])},
  {id:'spaced',name:'Three distant touches',source:fixture([.3,1.8,3.3],[.1,.025,.05])}];
}


/** Small, reproducible auditions drawn from the automatic path. The seed42 pair
 * holds the musical idea fixed to expose the effect of tighter source spacing. */
export function createLivingGeneratedStudyFixtures(){
 return [
  ['return','A returning motif',3828877473,'original'],
  ['linger','The last touch waits',42,'original'],
  ['soften','A softer return',140182646,'original'],
  ['open-limit','More space at the touch boundary',2950288811,'open'],
  ['close','The same waiting motif, closer',42,'close'],
 ].map(([id,name,seed,spacing])=>{const phrase=createLivingDirectedPhrase(seed,spacing);return {id,name,seed,spacing,source:phrase.source};});
}
