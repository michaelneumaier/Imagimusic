import {tensionerCore,tensionerEnd,tensionerState} from '../fm.js';
import {createTensionerPatch} from './patch.js';

/** One featured tone; times are seconds on the shared passage clock. */
export function createTensionerPerformance(settings,time=0,sampleRate=48000){
 if(!Number.isFinite(time)||time<0)throw new Error('FM entrance must be finite and non-negative');
 if(!Number.isFinite(sampleRate)||sampleRate<=0)throw new Error('FM sample rate must be positive');
 const saved=createTensionerPatch(settings,sampleRate).settings,core=tensionerCore(saved);
 const {samples,endS}=tensionerEnd(core,sampleRate);
 return {settings:saved,core,time,endS,duration:time+samples/sampleRate,sampleRate};
}

export function tensionerPerformanceFrame(performance,time){
 return tensionerState(time-performance.time,performance.core,performance.endS);
}
