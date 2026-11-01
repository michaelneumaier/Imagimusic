import {DEFAULT_LOOM,makeLoom} from '../loom/model.js';
import {createLoomPerformance} from '../loom/performance.js';

export const LOOM_MIX_GAIN=1;
export const DEFAULT_COMPOSITION={version:1,loom:{enabled:false,settings:{...DEFAULT_LOOM}}};

/** Arrangement is separate from the v4 instrument; old instruments and default traces stay valid. */
export function validateComposition(value=DEFAULT_COMPOSITION){
 if(value?.version!==1||typeof value.loom?.enabled!=='boolean')throw new Error('Unsupported ensemble composition');
 const settings=makeLoom(value.loom.settings).settings;
 return {version:1,loom:{enabled:value.loom.enabled,settings:Object.fromEntries(Object.keys(DEFAULT_LOOM).map(key=>[key,settings[key]]))}};
}
export function attachLoomPerformance(performance,composition=DEFAULT_COMPOSITION){
 const saved=validateComposition(composition);
 if(!saved.loom.enabled)return performance;
 const beat=60/performance.patch.tempo,offset=performance.patch.seed%2;
 const score=Array.from({length:8},(_,i)=>({time:.35+(1+i*2)*beat,body:(i+offset)%2,velocity:i%4===0?.7:.5}));
 const loom=createLoomPerformance(saved.loom.settings,score);
 return {...performance,composition:saved,loom,duration:Math.max(performance.duration,loom.duration)};
}
