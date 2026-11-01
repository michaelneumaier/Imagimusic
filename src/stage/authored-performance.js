import {createPerformanceFromEvents} from './performance.js';
import {attachComposition,validateComposition,DEFAULT_COMPOSITION} from './composition.js';

/** Compile the score author's seconds-based recipe. Canonical authoring data is saved by the caller. */
export function createAuthoredPerformance(patch,recipe,composition=DEFAULT_COMPOSITION,sampleRate=48000){
 if(!recipe||typeof recipe!=='object'||Array.isArray(recipe)||Object.keys(recipe).some(key=>!['events','loomScore','fmTime','holdUntil'].includes(key)))throw new Error('Unsupported authored performance recipe');
 if(!Number.isFinite(recipe.holdUntil)||recipe.holdUntil<0)throw new Error('Final hold must end at a finite non-negative time');
 const saved=validateComposition(composition,sampleRate);
 const base=createPerformanceFromEvents(patch,recipe.events,sampleRate),overrides={};
 if(saved.loom.enabled){
  if(!Object.hasOwn(recipe,'loomScore'))throw new Error('Authored Loom needs an explicit strike score');
  overrides.loomScore=recipe.loomScore;
 }
 if(saved.fm?.enabled){
  if(!Object.hasOwn(recipe,'fmTime'))throw new Error('Authored FM needs an explicit entrance');
  overrides.fmTime=recipe.fmTime;
 }
 const passage=attachComposition(base,saved,overrides);
 return {...passage,duration:Math.max(passage.duration,recipe.holdUntil)};
}
