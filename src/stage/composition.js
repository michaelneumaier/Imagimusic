import {DEFAULT_LOOM,makeLoom} from '../loom/model.js';
import {createLoomPerformance} from '../loom/performance.js';
import {createTensionerPatch} from '../tensioner/patch.js';
import {createTensionerPerformance} from '../tensioner/performance.js';

export const LOOM_MIX_GAIN=1;
export const FM_MIX_GAIN=1;
export const DEFAULT_COMPOSITION={version:1,loom:{enabled:false,settings:{...DEFAULT_LOOM}}};

/** Arrangement is separate from the v4 instrument; old instruments and default traces stay valid. */
export function validateComposition(value=DEFAULT_COMPOSITION,sampleRate=48000){
 if(![1,2].includes(value?.version)||typeof value.loom?.enabled!=='boolean')throw new Error('Unsupported ensemble composition');
 const settings=makeLoom(value.loom.settings).settings;
 const saved={version:value.version,loom:{enabled:value.loom.enabled,settings:Object.fromEntries(Object.keys(DEFAULT_LOOM).map(key=>[key,settings[key]]))}};
 if(value.version===2){
  if(typeof value.fm?.enabled!=='boolean'||!value.fm.settings)throw new Error('Composition v2 requires FM settings and enabled flag');
  saved.fm={enabled:value.fm.enabled,settings:createTensionerPatch(value.fm.settings,sampleRate).settings};
 }
 return saved;
}
export function attachLoomPerformance(performance,composition=DEFAULT_COMPOSITION,loomScore){
 const saved=validateComposition(composition,performance.sampleRate);
 if(!saved.loom.enabled)return performance;
 const beat=60/performance.patch.tempo,offset=performance.patch.seed%2;
 const score=loomScore??Array.from({length:8},(_,i)=>({time:.35+(1+i*2)*beat,body:(i+offset)%2,velocity:i%4===0?.7:.5}));
 const loom=createLoomPerformance(saved.loom.settings,score);
 return {...performance,composition:saved,loom,duration:Math.max(performance.duration,loom.duration)};
}

/** v1 stays canonical. Authoring overrides must be reconstructed from a saved explicit score,
 * never from a composition-only manifest; absent overrides preserve the original arrangement. */
export function attachComposition(performance,composition=DEFAULT_COMPOSITION,overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.keys(overrides).some(key=>!['loomScore','fmTime'].includes(key)))throw new Error('Unsupported composition score overrides');
 if(Object.hasOwn(overrides,'fmTime')&&(!Number.isFinite(overrides.fmTime)||overrides.fmTime<0||overrides.fmTime>120))throw new Error('FM entrance must be between 0 and 120 seconds');
 if(Object.hasOwn(overrides,'loomScore')&&(!Array.isArray(overrides.loomScore)||!overrides.loomScore.length))throw new Error('Loom score override must contain strikes');
 const saved=validateComposition(composition,performance.sampleRate);
 const joined=attachLoomPerformance(performance,saved,overrides.loomScore);
 if(!saved.fm?.enabled)return joined;
 const fm=createTensionerPerformance(saved.fm.settings,overrides.fmTime??(.35+8*60/performance.patch.tempo),performance.sampleRate);
 return {...joined,composition:saved,fm,duration:Math.max(joined.duration,fm.duration)};
}
